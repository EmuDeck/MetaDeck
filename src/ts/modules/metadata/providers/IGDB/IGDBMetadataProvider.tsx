import {MetadataProvider} from "../../MetadataProvider";
import {
	CustomStoreCategory,
	Developer,
	IDDictionary,
	MetadataData,
	Publisher,
	StoreCategory
} from "../../../../Interfaces";
import {ProviderCache, ProviderConfig} from "../../../Provider";
import {Company, Game, GameMode, InvolvedCompany, MultiplayerMode} from "igdb-api-types";
import Logger from "../../../../logger";
import {FC, Fragment, useState} from "react";
import {PanelSectionRow, SliderField} from "@decky/ui";
import {closestWithLimit, distanceWithLimit} from "../../../../util";
import {Entry, IdOverrideComponent} from "../../../IdOverrideComponent";
import {callable, fetchNoCors} from "@decky/api";
import {t} from "../../../../useTranslations";
import {getLaunchCommand, getShortcutCategories, isEmulatedGame, romRegex} from "../../../../shortcuts";
import {ResolverCache, ResolverConfig} from "../../../Resolver";
import {MetadataProviderConfigs} from "../../MetadataModule";

export interface IGDBMetadataProviderConfig extends ProviderConfig<{}, ResolverConfig>
{
	fuzziness: number,
	overrides: IDDictionary
}

export interface IGDBMetadataProviderCache extends ProviderCache<{}, ResolverCache>
{
}

const API_URL = "https://p8peoy2h8d.execute-api.us-west-2.amazonaws.com/production/v4"
const API_KEY = "oVlXsxJS8G6ZSLuBuVbZjJYjLCjIcnSX4yLFr0d0"

export class IGDBMetadataProvider extends MetadataProvider<any>
{

	static identifier: keyof MetadataProviderConfigs = "igdb";
	static title: string = t("providerMetadataIGDB");
	identifier: keyof MetadataProviderConfigs = IGDBMetadataProvider.identifier;
	title: string = IGDBMetadataProvider.title;

	resolvers = []

	logger: Logger = new Logger(IGDBMetadataProvider.identifier)


	get overrides(): IDDictionary
	{
		return this.module.config.providers.igdb.overrides;
	}

	set overrides(data: IDDictionary)
	{
		this.module.config.providers.igdb.overrides = data;
		void this.module.saveData();
	}

	get fuzziness(): number
	{
		return this.module.config.providers.igdb.fuzziness;
	}

	set fuzziness(fuzziness: number)
	{
		this.module.config.providers.igdb.fuzziness = fuzziness;
		void this.module.saveData();
	}


	async provide(appId: number): Promise<MetadataData | undefined>
	{
		return this.throttle(() => this.getMetadataForGame(appId));
	}

	async test(appId: number): Promise<boolean>
	{
		if (this.overrides[appId] == 0)
			return false;
		const display_name = appStore.GetAppOverviewByAppID(appId)?.display_name;
		const results = await this.throttle(() => this.search(display_name));
		const names = results.map(value => value.title);
		const closest_names = distanceWithLimit(this.fuzziness, display_name, names);
		return closest_names.length > 0;
	}

	public normalize(str: string): string
	{
		return str
			   ?.toLowerCase()
			   ?.replace(/[^a-z\d \x7f-\xff]/gi, ' ')
			   ?.replace(/\s+/gi, ' ')
			   ?.trim();
	}


	private gameToMetadataData(game: Game): MetadataData
	{
		const gameDevs: Developer[] = []
		const gamePubs: Publisher[] = []
		const gameCats: (StoreCategory | CustomStoreCategory)[] = [CustomStoreCategory.NonSteam]

		if (game.game_modes && game.game_modes.length > 0)
		{
			for (let gameMode of game.game_modes)
			{
				gameMode = gameMode as GameMode
				if (gameMode.slug && gameMode.slug.length > 0)
				{
					switch (gameMode.slug)
					{
						case "single-player":
							gameCats.push(StoreCategory.SinglePlayer)
							break;
						case "multiplayer":
							gameCats.push(StoreCategory.MultiPlayer)
							break;
					}
				}
			}
		}

		if (game.multiplayer_modes && game.multiplayer_modes.length > 0)
		{
			for (let multiplayerMode of game.multiplayer_modes)
			{
				multiplayerMode = multiplayerMode as MultiplayerMode
				if (multiplayerMode.onlinecoop) gameCats.push(StoreCategory.OnlineCoOp)
				if (multiplayerMode.offlinecoop) gameCats.push(StoreCategory.LocalCoOp)
				if (multiplayerMode.splitscreen || multiplayerMode.splitscreenonline) gameCats.push(StoreCategory.SplitScreen)
				if (multiplayerMode.onlinecoop || multiplayerMode.splitscreenonline) gameCats.push(StoreCategory.OnlineMultiPlayer)
				if (multiplayerMode.offlinecoop || multiplayerMode.lancoop || multiplayerMode.splitscreen) gameCats.push(StoreCategory.LocalMultiPlayer)
			}
		}

		if (game.involved_companies && game.involved_companies.length > 0)
		{
			for (let involvedCompany of game.involved_companies)
			{
				involvedCompany = involvedCompany as InvolvedCompany
				if (involvedCompany.company
					   && (involvedCompany.company as Company).name
					   && (involvedCompany.company as Company).name!!.length > 0
					   && (involvedCompany.company as Company).url
					   && (involvedCompany.company as Company).url!!.length > 0
				)
				{
					if (involvedCompany.developer)
					{
						gameDevs.push({
							name: (involvedCompany.company as Company).name!!,
							url: (involvedCompany.company as Company).url!!
						})
					}

					if (involvedCompany.publisher)
					{
						gamePubs.push({
							name: (involvedCompany.company as Company).name!!,
							url: (involvedCompany.company as Company).url!!
						})
					}
				}
			}
		}

		// const compatCategoryResult = this.verifiedDB.find(result => result.Game == closest(game.name ?? "", this.verifiedDB.map(e => e.Game)))
		// this.logger.debug("compatdata: ", compatCategoryResult)
		// let compatCategory = SteamDeckCompatCategory.UNKNOWN
		// if (compatCategoryResult)
		// {
		// 	if (compatCategoryResult.Boots == YesNo.YES && compatCategoryResult.Playable == YesNo.YES)
		// 		compatCategory = SteamDeckCompatCategory.VERIFIED
		// 	else if (compatCategoryResult.Boots == YesNo.YES && (compatCategoryResult.Playable == YesNo.NO || compatCategoryResult.Playable == YesNo.PARTIAL))
		// 		compatCategory = SteamDeckCompatCategory.PLAYABLE
		// 	else
		// 		compatCategory = SteamDeckCompatCategory.UNSUPPORTED
		// }

		return {
			title: game.name ?? "No Title",
			id: game.id,
			description: game.summary ?? t("noDescription"),
			developers: gameDevs,
			publishers: gamePubs,
			rating: game.aggregated_rating,
			release_date: game.first_release_date,
			store_categories: gameCats
		}
	}

	private async search(title: string): Promise<MetadataData[]>
	{

		const response = (await fetchNoCors(`${API_URL}/games`, {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"x-api-key": API_KEY
			},
			body: `search \"${title}\"; limit 20; fields *, involved_companies.*, involved_companies.company.*, game_modes.*, multiplayer_modes.*, platforms.*;`
		}));
		if (response.ok)
		{
			let games: Game[] = await response.json()
			// noinspection SuspiciousTypeOfGuard
			if (!(games instanceof Array))
				return this.throttle(() => this.search(title));
			games = games.sort((a, b) => a.id - b.id)
			return games.map<MetadataData>(game => this.gameToMetadataData(game)).sort((a, b) => (a.id as number) - (b.id as number))
		} else if (response.status == 429)
		{
			return this.throttle(() => this.search(title));
		} else throw Error(`Could not find metadata for "${title}": \n${await response.text()}`);
	}

	public async getMetadataForGame(appId: number): Promise<MetadataData | undefined>
	{
		this.logger.debug(`Fetching metadata for game ${appId}`)

		const display_name = appStore.GetAppOverviewByAppID(appId)?.display_name;
		const data_id = this.overrides[appId];
		this.logger.debug("data_id", data_id);
		const results = await this.search(display_name);
		if (results.length > 0)
		{
			this.logger.debug("results", results);
			let games: MetadataData[];
			if (data_id === undefined)
			{
				const names = results.map(value => value.title);
				const closest_name = closestWithLimit(this.fuzziness, display_name, names)
				this.logger.debug(closest_name, results.map(value => value.title))
				const games1 = results.filter(value => value.title === closest_name)
				this.logger.debug("Games: ", games1)
				games = games1.filter(value => value.description !== "")
				// this.metadata_id[appId] = games.length > 0 ? games[0].id : 0;
				// await this.module.removeCache(appId);
			} else if (data_id === 0)
			{
				return undefined;
			} else
			{
				games = results.filter(value => value.id === data_id)
			}
			const game = games.reverse().pop();
			if (game)
			{
				game.store_categories = game.store_categories.concat(await getShortcutCategories(appId));
			}
			this.logger.debug(game);
			return game

		} else return undefined;
		// } else reject(new Error(`HTTP ERROR: ${response.status}`));
	}

	public async getAllMetadataForGame(appId: number): Promise<Record<number, MetadataData> | undefined>
	{
		const display_name = appStore.GetAppOverviewByAppID(appId)?.display_name;
		const results = await this.search(display_name);
		if (results.length > 0)
		{
			const names = results.map(value => value.title);
			const closest_names = distanceWithLimit(this.fuzziness, display_name, names);
			const games = results.filter(value => closest_names.includes(value.title));
			// const closest_name = closest(this.normalize(display_name), results.map(value => value.name) as string[])
			// const games = results.filter(value => (distance(display_name, value.title) < this.fuzziness))

			let ret: Record<number, MetadataData> = {};
			for (let game of games)
			{
				ret[+game.id] = game;
			}
			return ret;
		} else return undefined;
	}

	private file_size: (path: string) => Promise<number> = callable("file_size");
	private file_date: (path: string) => Promise<number> = callable("file_date");

	async apply(appId: number, data: MetadataData): Promise<void>
	{
		const launchCommand = await getLaunchCommand(appId);
		if (await isEmulatedGame(appId))
		{
			const path = launchCommand.match(romRegex)?.[0]
			if (path)
			{
				data.install_size = await this.file_size(path);
				data.install_date = await this.file_date(path);
			}
		}
	}

	settingsComponent(): FC
	{
		const [fuzziness, setFuzziness] = useState(this.fuzziness);
		const [overrides, setOverrides] = useState(this.overrides);
		return () => (
			   <Fragment>
				   <PanelSectionRow>
					   <SliderField
							 label={"Search Fuzziness"}
							 value={fuzziness}
							 min={0}
							 max={20}
							 step={1}
							 showValue={true}
							 resetValue={5}
							 editableValue={true}
							 validValues={'steps'}
							 onChange={(value) => {
								 setFuzziness(value);
								 this.fuzziness = value;
							 }}
					   />
				   </PanelSectionRow>
				   <PanelSectionRow>
					   <IdOverrideComponent
							 value={overrides}
							 onChange={(value) => {
								 this.logger.debug("overrides", value);
								 setOverrides(value)
								 this.overrides = value
							 }}
							 resultsForApp={async (appId) => {
								 const ret: Record<number, Entry<number>> = {}
								 for (const [id, value] of Object.entries(await this.throttle(() => this.getAllMetadataForGame(appId)) ?? []))
								 {
									 ret[+id] = {
										 label: appStore.GetAppOverviewByAppID(appId).display_name,
										 title: value.title,
										 id: +id,
										 appId: appId
									 }
								 }
								 return ret;
							 }}
					   />
				   </PanelSectionRow>
			   </Fragment>
		)
	}
}