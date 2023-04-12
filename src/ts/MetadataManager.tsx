import {ServerAPI} from "decky-frontend-lib";
import * as localforage from "localforage";
import {closest} from "fastest-levenshtein";
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
import {toNumber} from "lodash-es";
import {authenticate_igdb, get_metadata, get_metadata_id, set_metadata, set_metadata_id} from "./Python";
import Logger from "./logger";
import {Promise} from "bluebird";

const database = "metadeck";

localforage.config({
	name: database,
});

export async function getAllNonSteamAppIds(): Promise<number[]>
{
	return Array.from(collectionStore.deckDesktopApps.apps.keys());
}
export enum PlatformCategory {
	console = 1,
	arcade = 2,
	platform = 3,
	operating_system = 4,
	portable_console = 5,
	computer = 6,
}
export class MetadataManager
{
	set should_bypass(value: boolean)
	{
		this._should_bypass = value;
	}

	get should_bypass(): boolean
	{
		return this._should_bypass;
	}

	private readonly serverAPI: ServerAPI;
	private verifiedDB: VerifiedDBResults[] = [];
	private metadata: MetadataDictionary = {};
	private logger: Logger = new Logger("MetadataManager");
	private _should_bypass: boolean = false;

	constructor(serverAPI: ServerAPI)
	{
		this.serverAPI = serverAPI;
	}

	public async updateCache(appId: string, newData: MetadataData)
	{
		await localforage.setItem(appId, newData);
		await this.saveData();
	};

	public async removeCache(appId: string)
	{
		await localforage.removeItem(appId);
		await this.saveData();
	};

	public clearCache()
	{
		localforage.clear().then(() => this.saveData());
	};

	public async loadData()
	{
		this.metadata = await get_metadata(this.serverAPI);
		this.logger.debug("MetadataData", this.metadata);
		for (let key in this.metadata)
		{
			const data = this.metadata[toNumber(key)];
			await this.updateCache(key, data);
		}
		await set_metadata(this.serverAPI, this.metadata);
	}

	public async saveData()
	{
		this.metadata = {};
		await localforage.iterate<MetadataData, void>((value, key) =>
		{
			this.metadata[toNumber(key)] = value;
		});

		await set_metadata(this.serverAPI, this.metadata);
	}

	public async getCache(appId: string): Promise<MetadataData | null>
	{
		return await localforage.getItem<MetadataData>(appId);
	};

	public async needCacheUpdate(lastUpdatedAt: Date, appId: string)
	{
		const now = new Date();
		const durationMs = Math.abs(lastUpdatedAt.getTime() - now.getTime());

		const minutesBetweenDates = durationMs / (24 * 60 * 60 * 1000);
		return minutesBetweenDates > 31 || (await this.getCache(appId))===null;
	};

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
					const closest_name = closest(this.normalize(display_name), results.map(value => value.name) as string[])
					const games = results.filter(value => value.name===closest_name && value.summary!=="") as Game[]
					this.logger.debug(`Game ${JSON.stringify(games, undefined, "\t")}`)

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
									if (platform.category === PlatformCategory.console || platform.category === PlatformCategory.portable_console || platform.category === PlatformCategory.arcade && !gameCategories.includes(StoreCategory.FullController) && !gameCategories.includes(StoreCategory.PartialController))
									{
										gameCategories.push(StoreCategory.FullController)
									}
								}
							}
						}
						this.logger.debug(`StoreCategories: ${gameCategories}`)
						for (const category of gameCategories)
						{
							appStore.GetAppOverviewByAppID(app_id).m_setStoreCategories.add(category);
						}
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
						const closest_verified = closest(display_name, this.verifiedDB.map(value => value.Game));
						const compat_category_result = this.verifiedDB.find(value => value.Game===closest_verified)
						let compat_category: SteamDeckCompatCategory;
						if (compat_category_result)
						{
							if (compat_category_result["Boots?"]===YesNo.YES && compat_category_result["Playable?"]===YesNo.YES)
							{
								compat_category = SteamDeckCompatCategory.VERIFIED;
							} else if (compat_category_result["Boots?"]===YesNo.YES && compat_category_result["Playable?"]===YesNo.NO)
							{
								compat_category = SteamDeckCompatCategory.PLAYABLE
							} else
							{
								compat_category = SteamDeckCompatCategory.UNSUPPORTED
							}
						} else compat_category = SteamDeckCompatCategory.UNKNOWN;

						appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = compat_category;
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
						await this.updateCache(`${app_id}`, data);
						this.logger.debug(data);
						ret[game.id] = data;

					}
					this.logger.debug(ret);
					resolve(ret);

				} else resolve(undefined);
			} else reject(new Error(`HTTP ERROR: ${response.result}`));
		})
	}

	public async getMetadataForGame(app_id: number): Promise<MetadataData | undefined>
	{
		this.logger.debug(`Fetching metadata for game ${app_id}`)
		return new Promise<MetadataData | undefined>(async (resolve, reject) =>
		{
			const cache = await this.getCache(`${app_id}`);
			if (cache && !await this.needCacheUpdate(cache.last_updated_at, `${app_id}`))
			{
				appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = cache.compat_category
				resolve(cache);
			} else
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
						const data_id = await this.getMetadataId(app_id);
						let games: Game[];
						if (data_id===undefined)
						{
							const closest_name = closest(this.normalize(display_name), results.map(value => value.name) as string[])
							this.logger.debug(closest_name, results.map(value => value.name))
							const games1 = results.filter(value => value.name===closest_name) as Game[]
							this.logger.debug(`Game ${JSON.stringify(games1, undefined, "\t")}`)
							games = games1.filter(value => value.summary!=="")
							await this.setMetadataId(app_id, games.length > 0 ? games[0].id:0)
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
										if (platform.category === PlatformCategory.console || platform.category === PlatformCategory.portable_console || platform.category === PlatformCategory.arcade && !gameCategories.includes(StoreCategory.FullController) && !gameCategories.includes(StoreCategory.PartialController))
										{
											gameCategories.push(StoreCategory.FullController)
										}
									}
								}
							}
							this.logger.debug(`StoreCategories: ${gameCategories}`)
							for (const category of gameCategories)
							{
								appStore.GetAppOverviewByAppID(app_id).m_setStoreCategories.add(category);
							}
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
							const closest_verified = closest(display_name, this.verifiedDB.map(value => value.Game));
							const compat_category_result = this.verifiedDB.find(value => value.Game===closest_verified)
							let compat_category: SteamDeckCompatCategory;
							if (compat_category_result)
							{
								if (compat_category_result["Boots?"]===YesNo.YES && compat_category_result["Playable?"]===YesNo.YES)
								{
									compat_category = SteamDeckCompatCategory.VERIFIED;
								} else if (compat_category_result["Boots?"]===YesNo.YES && compat_category_result["Playable?"]===YesNo.NO)
								{
									compat_category = SteamDeckCompatCategory.PLAYABLE
								} else
								{
									compat_category = SteamDeckCompatCategory.UNSUPPORTED
								}
							} else compat_category = SteamDeckCompatCategory.UNKNOWN;
							appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = compat_category;
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
							await this.updateCache(`${app_id}`, data);
							resolve(data);
							this.logger.debug(data);
						}

					} else resolve(undefined);
				} else reject(new Error(`HTTP ERROR: ${response.result}`));
			}
		})
	}

	public fetchMetadata(app_id: number): MetadataData | undefined
	{
		if (this.metadata[app_id]===undefined)
		{
			let wait: boolean = true;
			this.getMetadataForGame(app_id).then(data =>
			{
				if (!!data)
				{
					this.logger.debug(`Fetched metadata for ${app_id}: `, data);
					this.metadata[app_id] = data;
					void this.saveData();
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
			this.metadata[app_id].store_categories?.forEach(category => appStore.GetAppOverviewByAppID(app_id).m_setStoreCategories.add(category))
			return this.metadata[app_id];
		}
	}

	public async fetchMetatdataAsync(app_id: number): Promise<MetadataData | undefined>
	{
		if (this.metadata[app_id]===undefined)
		{
			let data = await this.getMetadataForGame(app_id)
			if (!!data)
			{
				this.logger.debug(`Fetched metadata for ${app_id}: `, data);
				this.metadata[app_id] = data;
				void this.saveData();
			}
			return this.metadata[app_id];
		} else
		{
			appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = this.metadata[app_id].compat_category
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
			}
		}
	}

	async init(): Promise<void>
	{
		await this.getVerifiedDB();
		await this.loadData();
		await this.saveData();
		// const fetchMetadataDebounced = debounce((app_id: number) => this.fetchMetadata(app_id), 500, {leading: true});
		await Promise.map(getAllNonSteamAppIds(), async (app_id: number) => await this.fetchMetatdataAsync(app_id), {
			concurrency: 3
		});
	}

	async deinit(): Promise<void>
	{
		await this.saveData();
	}
}