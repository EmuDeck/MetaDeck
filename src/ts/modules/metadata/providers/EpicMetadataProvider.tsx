import {ProviderCache, ProviderConfig} from "../../provider";
import {MetadataProvider} from "../MetadataProvider";
import {CustomStoreCategory, Developer, MetadataData, Publisher, StoreCategory} from "../../../Interfaces";
import {getAppDetails} from "../../../util";
import {GamesDBResult, removeAfterAndIncluding, removeBeforeAndIncluding} from "./GamesDBResult";
import {FC} from "react";
import {fetchNoCors} from "@decky/api";
import {t} from "../../../useTranslations";
import {isFlatpakGame, isHeroicGame, isJunkStoreGame, isLutrisGame, isNSLGame} from "../../../retroachievements";

export interface EpicMetadataProviderConfig extends ProviderConfig
{

}

export interface EpicMetadataProviderCache extends ProviderCache
{

}

const API_URL = "https://gamesdb.gog.com/platforms/epic/external_releases"

export class EpicMetadataProvider extends MetadataProvider
{

	static identifier: string = "epic";
	static title: string = t("providerMetadataEpic");
	identifier: string = EpicMetadataProvider.identifier;
	title: string = EpicMetadataProvider.title;

	async provide(appId: number): Promise<MetadataData | undefined>
	{
		return this.throttle(async () => {
			const details = await getAppDetails(appId);
			if (details == null) return undefined;
			let launchCommand: string = ""
			if (details?.strShortcutLaunchOptions?.includes("%command%"))
				launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
			else
				launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`
			let id: string = "";
			if (launchCommand.includes("epic-launcher.sh"))
				id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "epic-launcher.sh"), details?.strShortcutExe).trim();
			else if (launchCommand.includes("com.epicgames.launcher://apps/"))
				id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "com.epicgames.launcher://apps/"), "?action").trim()
			else if (launchCommand.includes("heroic://launch/legendary/"))
				id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "heroic://launch/legendary/"), "\"").trim()

			const response = await fetchNoCors(`${API_URL}/${id}`);

			if (response.ok)
			{
				const result: GamesDBResult = await response.json();

				const devs: Developer[] = result.game.developers.map((dev) => ({name: dev.name, url: ""}));
				const pubs: Publisher[] = result.game.publishers.map((pub) => ({name: pub.name, url: ""}));

				const cats: (StoreCategory | CustomStoreCategory)[] = [CustomStoreCategory.NonSteam, CustomStoreCategory.Epic]

				const modes = result.game_modes.map((mode) => mode.slug)

				if (modes.includes("multiplayer"))
					cats.push(StoreCategory.MultiPlayer)
				if (modes.includes("co-operative"))
					cats.push(StoreCategory.CoOp)
				if (modes.includes("single-player"))
					cats.push(StoreCategory.SinglePlayer)

				if (await isJunkStoreGame(appId))
					cats.push(CustomStoreCategory.JunkStore);
				if (await isNSLGame(appId))
					cats.push(CustomStoreCategory.NSL);
				if (await isHeroicGame(appId))
					cats.push(CustomStoreCategory.Heroic);
				if (await isLutrisGame(appId))
					cats.push(CustomStoreCategory.Lutris);
				if (await isFlatpakGame(appId))
					cats.push(CustomStoreCategory.Flatpak);

				return {
					id: result.id,
					title: result.title["en-US"],
					description: result.summary["en-US"],
					rating: result.game.aggregated_rating,
					release_date: Math.floor(new Date(result.game.first_release_date).getTime() / 1000),
					developers: devs,
					publishers: pubs,
					store_categories: cats
				}
			}

			return;
		});
	}

	async test(appId: number): Promise<boolean>
	{
		const details = await getAppDetails(appId);
		let launchCommand: string
		if (details?.strShortcutLaunchOptions?.includes("%command%"))
			launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
		else
			launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`


		return !!launchCommand?.includes("epic-launcher.sh")
			   || !!launchCommand?.includes("com.epicgames.launcher://apps/")
			   || !!launchCommand?.includes("heroic://launch/legendary/");
	}

	settingsComponent(): FC
	{
		return () => undefined
	}
}