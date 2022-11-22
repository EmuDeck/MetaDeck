import {ServerAPI} from "decky-frontend-lib";
import * as localforage from "localforage";
import {closest} from "fastest-levenshtein";
import {
	Developer,
	DevelopersResults,
	Game,
	HTTPResult,
	MetadataData,
	Publisher,
	PublishersResults,
	SearchResults,
	SteamDeckCompatCategory,
	VerifiedDBResults,
	YesNo
} from "./Interfaces";
import {SteamShortcut} from "./SteamClient";

const database = "metadeck";

const api_key = "6bb664436d380345c89c62726fb028e25c59e19aafc06f690430ac3e9db51104";

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
	private serverAPI: ServerAPI;
	private developers: Developer[] = [];
	private publishers: Publisher[] = [];
	private verifiedDB: VerifiedDBResults[] = [];
	private metadata: { [key: number]: MetadataData } = {};
	private _should_bypass: boolean = false;
	constructor(serverAPI: ServerAPI)
	{
		this.serverAPI = serverAPI;
	}

	public async updateCache(appId: string, newData: MetadataData)
	{
		await localforage.setItem(appId, newData);
	};

	public clearCache()
	{
		localforage.clear();
	};

	public async getCache(appId: string): Promise<MetadataData | null>
	{
		return await localforage.getItem<MetadataData>(appId);
	};

	public async needCacheUpdate(lastUpdatedAt: Date, appId: string)
	{
		const now = new Date();
		const durationMs = Math.abs(lastUpdatedAt.getTime() - now.getTime());

		const minutesBetweenDates = durationMs / (60 * 60 * 1000);
		return minutesBetweenDates > 2 || await this.getCache(appId)===null;
	};

	public normalize(str: string): string
	{
		return str
				.toLowerCase()
				.replace(/[^a-z\d \x7f-\xff]/gi, ' ')
				.replace(/\s+/gi, ' ')
				.trim();
	}

	public async getMetadataForGame(app_id: number): Promise<MetadataData | undefined>
	{
		return new Promise<MetadataData | undefined>(async (resolve, reject) =>
		{
			const cache = await this.getCache(`${app_id}`);
			if (cache && !await this.needCacheUpdate(cache.last_updated_at, `${app_id}`))
			{
				appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = cache.compat_category
				resolve(cache);
			} else
			{
				const display_name = appStore.GetAppOverviewByAppID(app_id).display_name;
				const response = (await this.serverAPI.fetchNoCors<HTTPResult>(`https://api.thegamesdb.net/v1/Games/ByGameName?apikey=${api_key}&name=${display_name}&fields=players,publishers,genres,overview,last_updated,rating,platform,coop,youtube,os,processor,ram,hdd,video,sound,alternates`, {
					method: "GET"
				}));

				const result = response.result as HTTPResult;
				if (result.status === 200)
				{
					const results: SearchResults = JSON.parse(result.body);
					if (results.data.count > 0)
					{
						const closest_name = closest(this.normalize(display_name), results.data.games.map(value => value.game_title))
						console.log(closest_name, results.data.games.map(value => value.game_title))
						const games = results.data.games.filter(value => value.game_title === closest_name) as Game[]
						console.log(`Game ${JSON.stringify(games, undefined, "\t")}`)
						let gameDevs: Developer[] = [];
						let gamePubs: Publisher[] = [];
						for (const game of games)
						{
							if (game.overview === "")
								continue
							if (!!game.developers)
							{
								if (game.developers.filter(value => !this.developers.map(value => value.id).includes(value)).length === 0)
								{
									gameDevs = game.developers.map(value => this.developers.find(value1 => value1.id === value)).filter(Boolean) as Developer[];
								}
							}
							console.log(gameDevs);
							if (!!game.publishers)
							{
								if (game.publishers.filter(value => !this.publishers.map(value => value.id).includes(value)).length === 0)
								{
									gamePubs = game.publishers.map(value => this.publishers.find(value1 => value1.id === value)).filter(Boolean) as Publisher[];
								}
							}
							console.log(gamePubs);
							const closest_verified = closest(display_name, this.verifiedDB.map(value => value.Game));
							const compat_category_result = this.verifiedDB.find(value => value.Game === closest_verified)
							let compat_category: SteamDeckCompatCategory;
							if (compat_category_result)
							{
								if (compat_category_result["Boots?"] === YesNo.YES && compat_category_result["Playable?"] === YesNo.YES)
								{
									compat_category = SteamDeckCompatCategory.VERIFIED;
								}
								else if (compat_category_result["Boots?"] === YesNo.YES && compat_category_result["Playable?"] === YesNo.NO)
								{
									compat_category = SteamDeckCompatCategory.PLAYABLE
								}
								else
								{
									compat_category = SteamDeckCompatCategory.UNSUPPORTED
								}
							} else compat_category = SteamDeckCompatCategory.UNKNOWN;
							appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = compat_category;
							const data: MetadataData = {
								id: game.id,
								description: game.overview,
								developers: gameDevs,
								publishers: gamePubs,
								last_updated_at: new Date(),
								compat_category: compat_category
							}
							console.log(data);
							await this.updateCache(`${app_id}`, data);
							resolve(data)
						}

					} else resolve(undefined);
				}
				else reject(new Error(`HTTP ERROR: ${result.status}; ${JSON.stringify(JSON.parse(result.body), undefined, "\t")}`));
			}
		})
	}

	public fetchMetadata(app_id: number): MetadataData | undefined
	{
		if (this.metadata[app_id] === undefined)
		{
			let wait: boolean = true;
			this.getMetadataForGame(app_id).then(data =>
			{
				if (!!data)
				{
					console.log(`Fetched metadata for ${app_id}: ${data}`);
					this.metadata[app_id] = data;
				}
				wait = false;
			})
			while (wait)
			{

			}
			return this.metadata[app_id];
		}
		else
		{
			appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = this.metadata[app_id].compat_category
			return this.metadata[app_id];
		}
	}

	async getDevelopers(): Promise<void>
	{
		const response = (await this.serverAPI.fetchNoCors<HTTPResult>(`https://api.thegamesdb.net/v1/Developers?apikey=${api_key}`, {
			method: "GET"
		}));
		console.log(response)
		const devsResult = response.result as HTTPResult;
		console.log(devsResult);
		if (devsResult.status === 200)
		{
			const devsResults: DevelopersResults = JSON.parse(devsResult.body);
			this.developers = Object.values(devsResults.data.developers);
		}
	}

	async getPublishers(): Promise<void>
	{
		const response = (await this.serverAPI.fetchNoCors<HTTPResult>(`https://api.thegamesdb.net/v1/Publishers?apikey=${api_key}`, {
			method: "GET"
		}));
		const pubsResult = response.result as HTTPResult;
		if (pubsResult.status === 200)
		{
			const pubsResults: PublishersResults = JSON.parse(pubsResult.body);;
			this.publishers = Object.values(pubsResults.data.publishers);
		}
	}

	async getVerifiedDB(): Promise<void>
	{
		const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://opensheet.elk.sh/1fRqvAh_wW8Ho_8i966CCSBgPJ2R_SuDFIvvKsQCv05w/Database", {
			method: "GET"
		}));
		const verifiedResult = response.result as HTTPResult;
		if (verifiedResult.status === 200)
		{
			const verifiedResults: VerifiedDBResults[] = JSON.parse(verifiedResult.body);;
			this.verifiedDB = verifiedResults;
		}
	}

	async init(): Promise<void> {
		let shortcuts = await SteamClient.Apps.GetAllShortcuts()
		await Promise.all([this.getDevelopers(), this.getPublishers(), this.getVerifiedDB()]);
		for (const app_id of shortcuts.map((shortcut: SteamShortcut) => shortcut.appid))
		{
			this.fetchMetadata(app_id);
		}
	}
}