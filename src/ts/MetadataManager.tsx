import {ServerAPI} from "decky-frontend-lib";
import * as localforage from "localforage";
import {closest, distance} from "fastest-levenshtein";
import {
	HTTPResult,
	MetadataCustomDictionary,
	MetadataData,
	MetadataDictionary,
	MetadataIdDictionary,
	SteamDeckCompatCategory,
	VerifiedDBResults
} from "./Interfaces";

import {truncate} from "lodash-es";
import throttledQueue from 'throttled-queue';
import {MetaDeckState} from "./hooks/metadataContext";
import {SteamAppOverview} from "./SteamTypes";
import {format, t} from "./useTranslations";
import {Markdown} from "./markdown";
import {MetaDeckClient, yasdpl} from "../../lib/frontend";
import Logger = yasdpl.Logger;
import {Semaphore} from "async-mutex";
import {stateTransaction} from "./util";
import PromisePool from "es6-promise-pool";

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
	get metadata(): MetadataDictionary
	{
		return this._metadata;
	}

	set metadata(value: MetadataDictionary)
	{
		this._metadata = value;
	}
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

	get game(): string
	{
		return this.state.loadingData.game;
	}

	set game(value: string)
	{
		this.state.loadingData.game = value;
	}

	get description(): string
	{
		return this.state.loadingData.description;
	}

	set description(value: string)
	{
		this.state.loadingData.description = value;
	}

	get fetching(): boolean
	{
		return this.state.loadingData.fetching;
	}

	set fetching(value: boolean)
	{
		this.state.loadingData.fetching = value;
	}

	get serverAPI(): ServerAPI
	{
		return this.state.serverAPI;
	}

	private verifiedDB: VerifiedDBResults[] = [];
	private _metadata: MetadataDictionary = {};
	private metadata_id: MetadataIdDictionary = {};
	private metadata_custom: MetadataCustomDictionary = {};
	private logger: Logger;

	private _bypassBypass: number = 0;

	constructor(state: MetaDeckState)
	{
		this._state = state;
		this.logger = new Logger(MetaDeckClient, "MetadataManager");
	}

	private _state: MetaDeckState;


	public async removeCache(app_id: number)
	{
		delete this.metadata[app_id];
		await this.saveData();
		let appData = appDetailsStore.GetAppData(app_id);
		if (appData)
		{
			const overview = appStore.GetAppOverviewByAppID(app_id)
			const desc = t("noDescription");
			stateTransaction(() => {
				appData.descriptionsData = {
					strFullDescription: <Markdown>
						{`# ${overview.display_name}\n` + desc}
					</Markdown>,
					strSnippet: <Markdown>
						{`# ${overview.display_name}\n` + desc}
					</Markdown>
				}
				appData.associationData = {
					rgDevelopers: [],
					rgPublishers: [],
					rgFranchises: []
				}
				appDetailsCache.SetCachedDataForApp(app_id, "descriptions", 1, appData.descriptionsData)
				appDetailsCache.SetCachedDataForApp(app_id, "associations", 1, appData.associationData)
			});
		}
	};

	public async clearCache()
	{
		for (let app_id of Object.keys(this.metadata))
		{
			await this.removeCache(+app_id);
		}
		this.metadata = {};
		await this.saveData();
		this.logger.debug("Cache cleared", this.metadata);
		this.serverAPI.toaster.toast({
			title: t("title"),
			body: t("cacheCleared")
		})
	};

	private mutex: Semaphore = new Semaphore(1);

	public async loadData()
	{
		const [_, release] = await this.mutex.acquire();
		await this.state.settings.readSettings()
		this.metadata = this.state.settings.metadata;
		this.metadata_id = this.state.settings.metadata_id;
		this.metadata_custom = this.state.settings.metadata_custom;
		release();
	}

	public async saveData()
	{
		const [_, release] = await this.mutex.acquire();
		this.state.settings.metadata = this.metadata;
		this.state.settings.metadata_id = this.metadata_id;
		this.state.settings.metadata_custom = this.metadata_custom;
		await this.state.settings.writeSettings()
		this.logger.debug("data", this.metadata, this.metadata_id, this.metadata_custom)
		release();
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
		this.metadata_id[app_id] = data_id;
		delete this.metadata[app_id];
		await this.fetchMetadataAsync(app_id);
		await this.saveData();

	}

	public async getMetadataId(app_id: number): Promise<number | undefined>
	{
		return this.metadata_id[app_id];
	}

	public async getAllMetadataForGame(app_id: number): Promise<{ [index: number]: MetadataData } | undefined>
	{
		return new Promise<{ [index: number]: MetadataData } | undefined>(async (resolve, reject) => {

			const display_name = appStore.GetAppOverviewByAppID(app_id)?.display_name;

			// const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://api.igdb.com/v4/games", {
			// 	method: "POST",
			// 	headers: {
			// 		"Accept": "application/json",
			// 		"Client-ID": `${auth.client_id}`,
			// 		"Authorization": `Bearer ${auth.token}`,
			// 	},
			// 	body: `search \"${display_name}\"; fields *, involved_companies.*, involved_companies.company.*, game_modes.*, multiplayer_modes.*, platforms.*;`
			// }));
			const response = (await fetch(`https://api.emudeck.com/metadeck/api/search`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(
					   {
						   title: display_name,
					   }
				)
			}))
			this.logger.debug(response)

			if (response.ok)
			{
				const results = await response.json() as MetadataData[];
				if (results.length > 0)
				{
					// const closest_name = closest(this.normalize(display_name), results.map(value => value.name) as string[])
					const games = results.filter(value => (distance(this.normalize(display_name), value.title as string) < 500)) as MetadataData[]
					this.logger.debug("Games: ", games, results)

					let ret: { [index: number]: MetadataData } = {};
					for (let game of games)
					{
						ret[game.id] = game;
					}
					this.logger.debug(ret);
					resolve(ret);
				} else resolve(undefined);
			} else reject(new Error(`HTTP ERROR: ${response.status}`));
		})
	}

	private throttle = throttledQueue(4, 1000, true);

	public async getMetadataForGame(app_id: number): Promise<MetadataData | undefined>
	{
		this.logger.debug(`Fetching metadata for game ${app_id}`)
		if (this.metadata[app_id] || this.metadata_custom[app_id])
			return this.metadata[app_id];
		return new Promise<MetadataData | undefined>(async (resolve, reject) => {

			const display_name = appStore.GetAppOverviewByAppID(app_id)?.display_name;
			// const auth = await authenticate_igdb(this.serverAPI, this.client_id, this.client_secret);
			const data_id = await this.getMetadataId(app_id);
			this.logger.debug("data_id", data_id);
			// const response = (await fetch(`https://api.emudeck.com/metadeck/api/${data_id ? "get" : "search"}`, {
			// 	method: "POST",
			// 	headers: {
			// 		"Content-Type": "application/json"
			// 	},
			// 	body: JSON.stringify(
			// 		   data_id ?
			// 				 {
			// 					 id: data_id
			// 				 } :
			// 				 {
			// 					 title: display_name,
			// 				 }
			// 	)
			// }))
			const response = (await fetch(`https://api.emudeck.com/metadeck/api/search`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(
							 {
								 title: display_name,
							 }
				)
			}))
			// const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://api.igdb.com/v4/games", {
			// 	method: "POST",
			// 	headers: {
			// 		"Accept": "application/json",
			// 		"Client-ID": `${auth.client_id}`,
			// 		"Authorization": `Bearer ${auth.token}`,
			// 	},
			// 	body: `${data_id ? `where id = ${data_id}` : `search \"${display_name}\"`}; fields *, involved_companies.*, involved_companies.company.*, game_modes.*, multiplayer_modes.*, platforms.*;`
			// }));
			if (response.ok)
			{
				this.logger.debug("response", response);
				const results = await response.json() as MetadataData[];
				if (results.length > 0)
				{
					this.logger.debug("results", results);
					let games: MetadataData[];
					if (data_id === undefined)
					{
						const closest_name = closest(this.normalize(display_name), results.map(value => value.title) as string[])
						this.logger.debug(closest_name, results.map(value => value.title))
						const games1 = results.filter(value => value.title === closest_name)
						this.logger.debug("Games: ", games1)
						games = games1.filter(value => value.description !== "")
						this.metadata_id[app_id] = games.length > 0 ? games[0].id : 0;
						await this.removeCache(app_id);
					} else if (data_id === 0)
					{
						games = [];
						resolve(undefined);
					} else
					{
						games = results.filter(value => value.id === data_id)
					}
					for (let game of games)
					{
						this.logger.debug(game);
						resolve(game);
					}

				} else resolve(undefined);
			} else reject(new Error(`HTTP ERROR: ${response.status}`));
		})
	}

	public fetchMetadata(app_id: number): MetadataData | undefined
	{
		this.logger.debug(`Fetching metadata for ${app_id}`, this.metadata[app_id], this.metadata)
		if (!this.metadata[app_id])
			void this.fetchMetadataAsync(app_id);
		return this.metadata[app_id];
	}

	public async fetchMetadataAsync(app_id: number): Promise<MetadataData | undefined>
	{
		if (!this.metadata[app_id])
		{
			let data = await this.throttle(() => this.getMetadataForGame(app_id))
			if (!!data)
			{
				this.logger.debug(`Caching metadata for ${app_id}: `, data);
				this.metadata[app_id] = data;
			}
		} else
		{
			this.logger.debug(`Loading cached metadata for ${app_id}: `, this.metadata[app_id]);
		}
		appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = this.metadata[app_id]?.compat_category ?? SteamDeckCompatCategory.UNKNOWN

		// appStore.GetAppOverviewByAppID(app_id).steam_deck_compat_category = SteamDeckCompatCategory.VERIFIED
		this.metadata[app_id]?.store_categories?.forEach(category => appStore.GetAppOverviewByAppID(app_id).m_setStoreCategories.add(category))

		// let appData = appDetailsStore.GetAppData(app_id);
		// if (appData)
		// {
		// 	const overview = appStore.GetAppOverviewByAppID(app_id)
		// 	const desc = this.metadata[app_id]?.description ?? t("noDescription");
		// 	const devs = this.metadata[app_id]?.developers ?? [];
		// 	const pubs = this.metadata[app_id]?.publishers ?? [];
		// 	this.logger.debug(desc);
		// 	this.logger.debug(devs, pubs)
		// 	stateTransaction(() => {
		// 		appData.descriptionsData = {
		// 			strFullDescription: <Markdown>
		// 				{`# ${overview.display_name}\n` + desc}
		// 			</Markdown>,
		// 			strSnippet: <Markdown>
		// 				{`# ${overview.display_name}\n` + desc}
		// 			</Markdown>
		// 		}
		// 		appData.associationData = {
		// 			rgDevelopers: devs.map(value => ({
		// 				strName: value.name,
		// 				strURL: value.url
		// 			})),
		// 			rgPublishers: pubs.map(value => ({
		// 				strName: value.name,
		// 				strURL: value.url
		// 			})),
		// 			rgFranchises: []
		// 		}
		// 		appDetailsCache.SetCachedDataForApp(app_id, "descriptions", 1, appData.descriptionsData)
		// 		appDetailsCache.SetCachedDataForApp(app_id, "associations", 1, appData.associationData)
		// 	});
		// }

		return this.metadata[app_id];
	}

	async getVerifiedDB(): Promise<void>
	{
		const response = (await this.serverAPI.fetchNoCors<HTTPResult>("https://opensheet.elk.sh/1fRqvAh_wW8Ho_8i966CCSBgPJ2R_SuDFIvvKsQCv05w/Database", {
			method: "GET"
		}));
		this.logger.debug(`Verified DB: ${JSON.stringify(response, undefined, "\t")}`)
		if (response.success)
		{
			if (response.result.status === 200)
			{
				this.verifiedDB = JSON.parse(response.result.body);
				this.logger.debug(`Verified DB Parsed:`, this.verifiedDB);
			}
		}
	}

	async refresh_metadata_for_apps(app_ids: number[]): Promise<void>
	{
		this.fetching = false;
		this.total = app_ids.length;
		this.processed = 0;
		let self = this

		// @ts-ignore
		await new PromisePool(function * () {
			for (let appId of app_ids) {
				yield self.refresh_metadata_for_app(appId)
			}
		}, 4).start()
		this.globalLoading = false;
		this.game = t("fetching");
		this.description = "";
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
			this.game = overview.display_name;
			this.description = !!metadata ? format(t("foundMetadata"), truncate(metadata.description, {
				'length': 512,
				'omission': "..."
			}), {
				0: t("unknown"),
				1: t("unsupported"),
				2: t("playable"),
				3: t("verified")
			}[metadata.compat_category]) : t("noMetadata");
			this.processed++;
		} else
		{
			this.game = overview.display_name;
			this.description = t("noMetadata");
			this.processed++;
		}
	}

	async refresh(): Promise<void>
	{
		if (!this.globalLoading)
		{
			this.globalLoading = true;
			this.game = t("fetching")
			this.fetching = true;
			// await this.refresh_metadata_for_apps((await getAllNonSteamAppOverviews()).sort((a, b) =>
			// {
			//
			// 	if (a.display_name < b.display_name)
			// 	{
			// 		return -1;
			// 	}
			// 	if (a.display_name > b.display_name)
			// 	{
			// 		return 1;
			// 	}
			// 	return 0;
			// }).map(overview => overview.appid))
			// await this.loadData();
			this.logger.debug("metadata", this.metadata);
			await this.refresh_metadata_for_apps((await getAllNonSteamAppIds()))
			this.logger.debug("refreshed metadata", this.metadata);
			await this.saveData();
		}
	}

	async init(): Promise<void>
	{
		await this.loadData();
		await this.getVerifiedDB();
		// const fetchMetadataDebounced = debounce((app_id: number) => this.fetchMetadata(app_id), 500, {leading: true});
		await this.refresh();
	}

	async deinit(): Promise<void>
	{
		this.logger.debug("old metadata", this.metadata)
	}

	isReady(steamAppId: number): boolean
	{
		return this.metadata.hasOwnProperty(steamAppId);
	}
}