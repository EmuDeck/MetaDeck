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
	VerifiedDBResults,
	YesNo
} from "./Interfaces";

import {Game, InvolvedCompany, Company} from "igdb-api-types"
import {SteamShortcut} from "./SteamClient";
import {toNumber} from "lodash-es";
import {authenticate_igdb, get_metadata, get_metadata_id, set_metadata, set_metadata_id} from "./Python";
import Logger from "./logger";
import {Promise} from "bluebird";

const database = "metadeck";

localforage.config({
	name: database,
});

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
		this.logger.log("MetadataData", this.metadata);
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
				.toLowerCase()
				.replace(/[^a-z\d \x7f-\xff]/gi, ' ')
				.replace(/\s+/gi, ' ')
				.trim();
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
			this.logger.log(auth);

			const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://api.igdb.com/v4/games", {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Client-ID": `${auth.client_id}`,
					"Authorization": `Bearer ${auth.token}`,
				},
				body: `search \"${display_name}\"; fields *, involved_companies.*, involved_companies.company.*;`
			}));
			this.logger.log(response)

			if (response.success)
			{
				const results: Game[] = JSON.parse(response.result.body);
				if (results.length > 0)
				{
					const closest_name = closest(this.normalize(display_name), results.map(value => value.name) as string[])
					const games = results.filter(value => value.name===closest_name && value.summary!=="") as Game[]
					this.logger.log(`Game ${JSON.stringify(games, undefined, "\t")}`)

					let ret: { [index: number]: MetadataData } = {};
					for (let game of games)
					{
						let gameDevs: Developer[] = [];
						let gamePubs: Publisher[] = [];

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
							compat_category: compat_category
						}
						await this.updateCache(`${app_id}`, data);
						this.logger.log(data);
						ret[game.id] = data;

					}
					this.logger.log(ret);
					resolve(ret);

				} else resolve(undefined);
			} else reject(new Error(`HTTP ERROR: ${response.result}`));
		})
	}

	public async getMetadataForGame(app_id: number): Promise<MetadataData | undefined>
	{
		this.logger.log(`Fetching metadata for game ${app_id}`)
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
				this.logger.log(auth);
				const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://api.igdb.com/v4/games", {
					method: "POST",
					headers: {
						"Accept": "application/json",
						"Client-ID": `${auth.client_id}`,
						"Authorization": `Bearer ${auth.token}`,
					},
					body: `search \"${display_name}\"; fields *, involved_companies.*, involved_companies.company.*;`
				}));
				this.logger.log(response)

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
							this.logger.log(closest_name, results.map(value => value.name))
							const games1 = results.filter(value => value.name===closest_name) as Game[]
							this.logger.log(`Game ${JSON.stringify(games1, undefined, "\t")}`)
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
								compat_category: compat_category
							}
							await this.updateCache(`${app_id}`, data);
							resolve(data);
							this.logger.log(data);
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
					this.logger.log(`Fetched metadata for ${app_id}: `, data);
					this.metadata[app_id] = data;
					this.saveData().then(() =>
					{
					});
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
			return this.metadata[app_id];
		}
	}

	async getVerifiedDB(): Promise<void>
	{
		const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://opensheet.elk.sh/1fRqvAh_wW8Ho_8i966CCSBgPJ2R_SuDFIvvKsQCv05w/Database", {
			method: "GET"
		}));
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
		let shortcuts = await SteamClient.Apps.GetAllShortcuts()
		await this.getVerifiedDB();
		await this.loadData();
		await this.saveData();
		// const fetchMetadataDebounced = debounce((app_id: number) => this.fetchMetadata(app_id), 500, {leading: true});
		await Promise.map(shortcuts.map((shortcut: SteamShortcut) => shortcut.appid), async (app_id: number) => this.fetchMetadata(app_id), {
			concurrency: 3
		});
	}

	async deinit(): Promise<void>
	{
		await this.saveData();
	}
}