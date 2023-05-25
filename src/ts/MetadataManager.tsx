import {ServerAPI, sleep} from "decky-frontend-lib";
import * as localforage from "localforage";
import {closest, distance} from "fastest-levenshtein";
import {
	Developer,
	HTTPResult,
	MetadataData,
	MetadataDictionary,
	Publisher,
	SteamDeckCompatCategory,
	StoreCategory,
	VerifiedDBResults,
	YesNo
} from "./Interfaces";

import {Company, Game, GameMode, InvolvedCompany, MultiplayerMode, Platform} from "igdb-api-types"
import {DebouncedFunc, throttle, truncate} from "lodash-es";
import {
	authenticate_igdb,
	get_metadata,
	get_metadata_id,
	set_metadata,
	set_metadata_for_key,
	set_metadata_id
} from "./Python";
import Logger from "./logger";
import {Promise} from "bluebird";
import {MetaDeckState} from "./hooks/metadataContext";
import {SteamAppOverview} from "./SteamTypes";
import {format, getTranslateFunc} from "./useTranslations";
import {Markdown} from "./markdown";
import {runInAction} from "mobx";

const database = "metadeck";

localforage.config({
	name: database,
});

export async function getAllNonSteamAppIds(): Promise<number[]>
{
	return Array.from(collectionStore.deckDesktopApps.apps.keys());
}

export async function getAllNonSteamAppOverviews(): Promise<SteamAppOverview[]>
{
	return Array.from(collectionStore.deckDesktopApps.apps.values());
}

export enum PlatformCategory
{
	console = 1,
	arcade = 2,
	platform = 3,
	operating_system = 4,
	portable_console = 5,
	computer = 6,
}

export interface Manager
{
	state: MetaDeckState,

	init(): Promise<void>,

	deinit(): Promise<void>,

	refresh(): Promise<void>
}

export class MetadataManager implements Manager
{
	private t = getTranslateFunc()

	get bypassBypass(): number
	{
		return this._bypassBypass;
	}

	set bypassBypass(value: number)
	{
		this._bypassBypass = value;
	}

	get state(): MetaDeckState
	{
		return this._state;
	}

	set state(value: MetaDeckState)
	{
		this._state = value;
	}

	get globalLoading(): boolean
	{
		return this.state.loadingData.globalLoading;
	}

	set globalLoading(value: boolean)
	{
		this.state.loadingData.globalLoading = value;
	}

	get processed(): number
	{
		return this.state.loadingData.processed;
	}

	set processed(value: number)
	{
		this.state.loadingData.processed = value;
	}

	get total(): number
	{
		return this.state.loadingData.total;
	}

	set total(value: number)
	{
		this.state.loadingData.total = value;
	}

	get currentGame(): string
	{
		return this.state.loadingData.currentGame;
	}

	set currentGame(value: string)
	{
		this.state.loadingData.currentGame = value;
	}

	get serverAPI(): ServerAPI
	{
		return this.state.serverAPI;
	}

	private verifiedDB: VerifiedDBResults[] = [];
	private metadata: MetadataDictionary = {};
	private logger: Logger = new Logger("MetadataManager");

	private _bypassBypass: number = 0;

	constructor(state: MetaDeckState)
	{
		this._state = state;
	}

	private _state: MetaDeckState;


	public async removeCache(app_id: number)
	{
		// await localforage.removeItem(appId);
		delete this.metadata[app_id];
		await set_metadata_for_key(this.serverAPI, app_id, null)
	};

	public clearCache()
	{
		this.metadata = {};
		void this.saveData();
	};

	public async loadData()
	{
		this.metadata = await get_metadata(this.serverAPI);
		await this.saveData();
	}

	public async saveData()
	{
		await set_metadata(this.serverAPI, this.metadata);
	}

	public normalize(str: string): string
	{
		return str
				?.toLowerCase()
				?.replace(/[^a-z\d \x7f-\xff]/gi, ' ')
				?.replace(/\s+/gi, ' ')
				?.trim();
	}

	public async setMetadataId(app_id: number, data_id: number): Promise<void>
	{
		let metadata = await get_metadata_id(this.serverAPI);
		metadata[app_id] = data_id;
		await set_metadata_id(this.serverAPI, metadata);
		await this.removeCache(app_id);
		const data = await this.fetchMetadataAsync(app_id);
		let appData = appDetailsStore.GetAppData(app_id);
		if (appData)
		{
			const overview = appStore.GetAppOverviewByAppID(app_id)
			const desc = data?.description ?? this.t("noDescription");
			const devs = data?.developers ?? [];
			const pubs = data?.publishers ?? [];
			this.logger.debug(desc);
			this.logger.debug(devs, pubs)
			runInAction(() => {
				appData.descriptionsData = {
					strFullDescription: <Markdown>
						{`# ${overview.display_name}\n` + desc}
					</Markdown>,
					strSnippet: <Markdown>
						{`# ${overview.display_name}\n` + desc}
					</Markdown>
				}
				appData.associationData = {
					rgDevelopers: devs.map(value => ({
						strName: value.name,
						strURL: value.url
					})),
					rgPublishers: pubs.map(value => ({
						strName: value.name,
						strURL: value.url
					})),
					rgFranchises: []
				}
				appDetailsCache.SetCachedDataForApp(app_id, "descriptions", 1, appData.descriptionsData)
				appDetailsCache.SetCachedDataForApp(app_id, "associations", 1, appData.associationData)
			});
		}
	}

	public async getMetadataId(app_id: number): Promise<number | undefined>
	{
		return (await get_metadata_id(this.serverAPI))[app_id];
	}

	public async getAllMetadataForGame(app_id: number): Promise<{ [index: number]: MetadataData } | undefined>
	{
		return new Promise<{ [index: number]: MetadataData } | undefined>(async (resolve, reject) =>
		{

			const display_name = appStore.GetAppOverviewByAppID(app_id)?.display_name;
			const auth = await authenticate_igdb(this.serverAPI);
			this.logger.debug(auth);

			const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://api.igdb.com/v4/games", {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Client-ID": `${auth.client_id}`,
					"Authorization": `Bearer ${auth.token}`,
				},
				body: `search \"${display_name}\"; fields *, involved_companies.*, involved_companies.company.*, game_modes.*, multiplayer_modes.*, platforms.*;`
			}));
			this.logger.debug(response)

			if (response.success)
			{
				const results: Game[] = JSON.parse(response.result.body);
				if (results.length > 0)
				{
					// const closest_name = closest(this.normalize(display_name), results.map(value => value.name) as string[])
					const games = results.filter(value => (distance(this.normalize(display_name), value.name as string) < 20) && value.summary!=="") as Game[]
					this.logger.debug("Games: ", games)

					let ret: { [index: number]: MetadataData } = {};
					for (let game of games)
					{
						let gameDevs: Developer[] = [];
						let gamePubs: Publisher[] = [];
						let gameCategories: StoreCategory[] = [];
						if (!!game.game_modes)
						{
							game.game_modes = game.game_modes as GameMode[];
							for (const game_mode of game.game_modes)
							{
								if (!!game_mode.slug)
								{
									switch (game_mode.slug)
									{
										case "single-player":
											gameCategories.push(StoreCategory.SinglePlayer)
											break;

										case "multiplayer":
											gameCategories.push(StoreCategory.MultiPlayer)
											break;
									}
									this.logger.debug(`Game mode: ${game_mode.slug}`)
								}
							}
						}
						if (!!game.multiplayer_modes)
						{
							game.multiplayer_modes = game.multiplayer_modes as MultiplayerMode[];
							for (const multiplayer_mode of game.multiplayer_modes)
							{
								if (!!multiplayer_mode.onlinecoop)
								{
									gameCategories.push(StoreCategory.OnlineCoOp)
								}
								if (!!multiplayer_mode.offlinecoop)
								{
									gameCategories.push(StoreCategory.LocalCoOp)
								}
								if (!!multiplayer_mode.splitscreen || !!multiplayer_mode.splitscreenonline)
								{
									gameCategories.push(StoreCategory.SplitScreen)
								}
								if (!!multiplayer_mode.onlinecoop || !!multiplayer_mode.splitscreenonline)
								{
									gameCategories.push(StoreCategory.OnlineMultiPlayer)
								}
								if (!!multiplayer_mode.offlinecoop || !!multiplayer_mode.lancoop || !!multiplayer_mode.splitscreen)
								{
									gameCategories.push(StoreCategory.LocalMultiPlayer)
								}
								this.logger.debug(`Multiplayer mode: ${multiplayer_mode.id}`)
							}
						}
						if (!!game.platforms)
						{
							game.platforms = game.platforms as Platform[];
							for (const platform of game.platforms)
							{
								if (!!platform.category)
								{
									if (platform.category===PlatformCategory.console || platform.category===PlatformCategory.portable_console || platform.category===PlatformCategory.arcade && !gameCategories.includes(StoreCategory.FullController) && !gameCategories.includes(StoreCategory.PartialController))
									{
										gameCategories.push(StoreCategory.FullController)
									}
								}
							}
						}
						this.logger.debug("StoreCategories: ", gameCategories)
						if (!!game.involved_companies)
						{
							game.involved_companies = game.involved_companies as InvolvedCompany[]
							for (const involved_company of game.involved_companies)
							{
								if (!!involved_company.company)
								{
									const company_results = involved_company.company as Company;
									if (involved_company.developer)
									{
										gameDevs.push({
											name: company_results.name as string,
											url: company_results.url as string
										});
									}
									if (involved_company.publisher)
									{
										gamePubs.push({
											name: company_results.name as string,
											url: company_results.url as string
										});
									}
								}

							}
						}
						await this.getVerifiedDB();
						const closest_verified = closest(display_name, this.verifiedDB.map(value => value.Game));
						const compat_category_result = this.verifiedDB.find(value => value.Game===closest_verified)
						let compat_category: SteamDeckCompatCategory;
						if (compat_category_result)
						{
							if (compat_category_result?.Boots===YesNo.YES && compat_category_result?.Playable===YesNo.YES)
							{
								compat_category = SteamDeckCompatCategory.VERIFIED;
							} else if (compat_category_result?.Boots===YesNo.YES && compat_category_result?.Playable===YesNo.NO)
							{
								compat_category = SteamDeckCompatCategory.PLAYABLE
							} else
							{
								compat_category = SteamDeckCompatCategory.UNSUPPORTED
							}
						} else compat_category = SteamDeckCompatCategory.UNKNOWN;

						let data: MetadataData = {
							title: game.name ?? "No Title",
							id: game.id,
							description: game.summary ?? "No Description",
							developers: gameDevs,
							publishers: gamePubs,
							last_updated_at: new Date(),
							release_date: game.first_release_date,
							compat_category: compat_category,
							store_categories: gameCategories
						}
						this.logger.debug(data);
						ret[game.id] = data;
						await sleep(350)
					}
					this.logger.debug(ret);
					resolve(ret);
				} else resolve(undefined);
			} else reject(new Error(`HTTP ERROR: ${response.result}`));
		})
	}

	private getMetadataForGameThrottled: DebouncedFunc<(app_id: number) => Promise<MetadataData | undefined>> = throttle(this.getMetadataForGame, 300, {leading: true}) ;

	public async getMetadataForGame(app_id: number): Promise<MetadataData | undefined>
	{
		this.logger.debug(`Fetching metadata for game ${app_id}`)
		return new Promise<MetadataData | undefined>(async (resolve, reject) =>
		{

			const display_name = appStore.GetAppOverviewByAppID(app_id)?.display_name;
			const auth = await authenticate_igdb(this.serverAPI);
			const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://api.igdb.com/v4/games", {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Client-ID": `${auth.client_id}`,
					"Authorization": `Bearer ${auth.token}`,
				},
				body: `search \"${display_name}\"; fields *, involved_companies.*, involved_companies.company.*, game_modes.*, multiplayer_modes.*, platforms.*;`
			}));
			this.logger.debug("response", response)

			if (response.success)
			{
				const results: Game[] = JSON.parse(response.result.body);
				if (results.length > 0)
				{
					const data_id = await this.getMetadataId(app_id);
					let games: Game[];
					if (data_id===undefined)
					{
						const closest_name = closest(this.normalize(display_name), results.map(value => value.name) as string[])
						this.logger.debug(closest_name, results.map(value => value.name))
						const games1 = results.filter(value => value.name===closest_name) as Game[]
						this.logger.debug("Games: ", games1)
						games = games1.filter(value => value.summary!=="")
						let metadata = await get_metadata_id(this.serverAPI);
						metadata[app_id] = games.length > 0 ? games[0].id:0;
						await set_metadata_id(this.serverAPI, metadata);
						await this.removeCache(app_id);
					} else if (data_id===0)
					{
						games = [];
						resolve(undefined);
					} else
					{
						games = results.filter(value => value.id===data_id)
					}
					for (let game of games)
					{
						let gameDevs: Developer[] = [];
						let gamePubs: Publisher[] = [];
						let gameCategories: StoreCategory[] = [];
						if (!!game.game_modes)
						{
							game.game_modes = game.game_modes as GameMode[];
							for (const game_mode of game.game_modes)
							{
								if (!!game_mode.slug)
								{
									switch (game_mode.slug)
									{
										case "single-player":
											gameCategories.push(StoreCategory.SinglePlayer)
											break;

										case "multiplayer":
											gameCategories.push(StoreCategory.MultiPlayer)
											break;
									}
									this.logger.debug(`Game mode: ${game_mode.slug}`)
								}
							}
						}
						if (!!game.multiplayer_modes)
						{
							game.multiplayer_modes = game.multiplayer_modes as MultiplayerMode[];
							for (const multiplayer_mode of game.multiplayer_modes)
							{
								if (!!multiplayer_mode.onlinecoop)
								{
									gameCategories.push(StoreCategory.OnlineCoOp)
								}
								if (!!multiplayer_mode.offlinecoop)
								{
									gameCategories.push(StoreCategory.LocalCoOp)
								}
								if (!!multiplayer_mode.splitscreen || !!multiplayer_mode.splitscreenonline)
								{
									gameCategories.push(StoreCategory.SplitScreen)
								}
								if (!!multiplayer_mode.onlinecoop || !!multiplayer_mode.splitscreenonline)
								{
									gameCategories.push(StoreCategory.OnlineMultiPlayer)
								}
								if (!!multiplayer_mode.offlinecoop || !!multiplayer_mode.lancoop || !!multiplayer_mode.splitscreen)
								{
									gameCategories.push(StoreCategory.LocalMultiPlayer)
								}
								this.logger.debug(`Multiplayer mode: ${multiplayer_mode.id}`)
							}
						}
						if (!!game.platforms)
						{
							game.platforms = game.platforms as Platform[];
							for (const platform of game.platforms)
							{
								if (!!platform.category)
								{
									if (platform.category===PlatformCategory.console || platform.category===PlatformCategory.portable_console || platform.category===PlatformCategory.arcade && !gameCategories.includes(StoreCategory.FullController) && !gameCategories.includes(StoreCategory.PartialController))
									{
										gameCategories.push(StoreCategory.FullController)
									}
								}
							}
						}
						this.logger.debug("StoreCategories: ", gameCategories)
						if (!!game.involved_companies)
						{
							game.involved_companies = game.involved_companies as InvolvedCompany[]
							for (const involved_company of game.involved_companies)
							{
								if (!!involved_company.company)
								{
									const company_results = involved_company.company as Company;
									if (involved_company.developer)
									{
										gameDevs.push({
											name: company_results.name as string,
											url: company_results.url as string
										});
									}
									if (involved_company.publisher)
									{
										gamePubs.push({
											name: company_results.name as string,
											url: company_results.url as string
										});
									}
								}

							}
						}
						await this.getVerifiedDB();
						const closest_verified = closest(display_name, this.verifiedDB.map(value => value.Game));
						const compat_category_result = this.verifiedDB.find(value => value.Game===closest_verified)
						let compat_category: SteamDeckCompatCategory;
						if (compat_category_result)
						{
							if (compat_category_result?.Boots===YesNo.YES && compat_category_result?.Playable===YesNo.YES)
							{
								compat_category = SteamDeckCompatCategory.VERIFIED;
							} else if (compat_category_result?.Boots===YesNo.YES && (compat_category_result?.Playable===YesNo.NO || compat_category_result?.Playable===YesNo.PARTIAL))
							{
								compat_category = SteamDeckCompatCategory.PLAYABLE
							} else
							{
								compat_category = SteamDeckCompatCategory.UNSUPPORTED
							}
						} else compat_category = SteamDeckCompatCategory.UNKNOWN;
						this.logger.debug("compat_category: ", display_name, closest_verified, compat_category_result, compat_category, this.verifiedDB.map(value => value.Game), this.verifiedDB)
						let data: MetadataData = {
							title: game.name ?? "No Title",
							id: game.id,
							description: game.summary ?? "No Description",
							developers: gameDevs,
							publishers: gamePubs,
							last_updated_at: new Date(),
							release_date: game?.first_release_date,
							compat_category: compat_category,
							store_categories: gameCategories
						}
						this.logger.debug(data);
						resolve(data);
					}

				} else resolve(undefined);
			} else reject(new Error(`HTTP ERROR: ${response.result}`));
		})
	}

	public fetchMetadata(app_id: number): MetadataData | undefined
	{
		if (!this.metadata[app_id])
		{
			let wait: boolean = true;
			this.getMetadataForGameThrottled(app_id)?.then(async (data) =>
			{
				if (!!data)
				{
					this.logger.debug(`Fetched metadata for ${app_id}: `, data);
					this.metadata[app_id] = data;
					appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = this.metadata[app_id].compat_category
					// appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = SteamDeckCompatCategory.VERIFIED
				}
				wait = false;
			})
			while (wait)
			{

			}
			return this.metadata[app_id];
		} else
		{
			appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = this.metadata[app_id].compat_category
			// appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = SteamDeckCompatCategory.VERIFIED
			this.metadata[app_id].store_categories?.forEach(category => appStore.GetAppOverviewByAppID(app_id).m_setStoreCategories.add(category))
			return this.metadata[app_id];
		}
	}

	public async fetchMetadataAsync(app_id: number): Promise<MetadataData | undefined>
	{
		if (!this.metadata[app_id])
		{
			let data = await this.getMetadataForGameThrottled(app_id)
			if (!!data)
			{
				this.logger.debug(`Caching metadata for ${app_id}: `, data);
				this.metadata[app_id] = data;
				appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = this.metadata[app_id].compat_category
				// appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = SteamDeckCompatCategory.VERIFIED
				this.metadata[app_id].store_categories?.forEach(category => appStore.GetAppOverviewByAppID(app_id).m_setStoreCategories.add(category))
				await set_metadata_for_key(this.serverAPI, app_id, this.metadata[app_id]);
			}
			return this.metadata[app_id];
		} else
		{
			this.logger.debug(`Loading cached metadata for ${app_id}: `, this.metadata[app_id]);
			appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = this.metadata[app_id].compat_category
			// appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = SteamDeckCompatCategory.VERIFIED
			this.metadata[app_id].store_categories?.forEach(category => appStore.GetAppOverviewByAppID(app_id).m_setStoreCategories.add(category))
			return this.metadata[app_id];
		}
	}

	async getVerifiedDB(): Promise<void>
	{
		const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://opensheet.elk.sh/1fRqvAh_wW8Ho_8i966CCSBgPJ2R_SuDFIvvKsQCv05w/Database", {
			method: "GET"
		}));
		this.logger.debug(`Verified DB: ${JSON.stringify(response, undefined, "\t")}`)
		if (response.success)
		{
			if (response.result.status===200)
			{
				this.verifiedDB = JSON.parse(response.result.body);
				this.logger.debug(`Verified DB Parsed:`, this.verifiedDB);
			}
		}
	}

	async refresh_metadata_for_apps(app_ids: number[]): Promise<void>
	{
		await this.loadData();
		this.total = app_ids.length;
		this.processed = 0;
		await Promise.map(app_ids, (async (app_id) =>
		{
			this.logger.debug(`Metadata at ${app_id}`, this.metadata);
			await this.refresh_metadata_for_app(app_id);
		}), {
			concurrency: 3
		});
		this.globalLoading = false;
		this.processed = 0;
		this.total = 0;
	}

	private async refresh_metadata_for_app(app_id: number): Promise<void>
	{
		const overview = appStore.GetAppOverviewByAppID(app_id);
		const metadata = await this.fetchMetadataAsync(app_id)
		this.logger.debug(`Refreshed metadata for ${app_id}: `, metadata);
		if (overview && metadata)
		{
			this.currentGame = format(this.t("currentGame"), overview.display_name, !!metadata ? format(this.t("foundMetadata"), truncate(metadata.description, {
				'length': 64,
				'omission': "..."
			}), {
				0: this.t("unknown"),
				1: this.t("unsupported"),
				2: this.t("playable"),
				3: this.t("verified")
			}[metadata.compat_category]):this.t("noMetadata"));
			this.processed++;
		} else
		{
			this.currentGame = format(this.t("currentGame"), overview.display_name, this.t("noMetadata"));
			this.processed++;
		}
	}

	async refresh(): Promise<void>
	{
		if (!this.globalLoading)
		{
			this.globalLoading = true;
			this.currentGame = this.t("fetching")
			await this.refresh_metadata_for_apps((await getAllNonSteamAppOverviews()).sort((a, b) =>
			{

				if (a.display_name < b.display_name)
				{
					return -1;
				}
				if (a.display_name > b.display_name)
				{
					return 1;
				}
				return 0;
			}).map(overview => overview.appid))
		}
	}

	async init(): Promise<void>
	{
		await this.getVerifiedDB();
		await this.loadData();
		this.logger.debug("metadata", this.metadata);
		// const fetchMetadataDebounced = debounce((app_id: number) => this.fetchMetadata(app_id), 500, {leading: true});
		await this.refresh()
	}

	async deinit(): Promise<void>
	{
		await this.saveData();
	}

	isReady(steamAppId: number): boolean
	{
		return !!this.metadata[steamAppId];
	}
}