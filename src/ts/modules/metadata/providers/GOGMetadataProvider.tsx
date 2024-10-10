import {ProviderCache, ProviderConfig} from "../../provider";
import {MetadataProvider} from "../MetadataProvider";
import {CustomStoreCategory, Developer, MetadataData, Publisher, StoreCategory} from "../../../Interfaces";
import {getAppDetails} from "../../../util";
import {GamesDBResult, removeAfterAndIncluding, removeBeforeAndIncluding} from "./GamesDBResult";
import {FC} from "react";
import {fetchNoCors} from "@decky/api";
import {t} from "../../../useTranslations";
import {isFlatpakGame, isHeroicGame, isJunkStoreGame, isLutrisGame, isNSLGame} from "../../../retroachievements";

export interface GOGMetadataProviderConfig extends ProviderConfig
{

}

export interface GOGMetadataProviderCache extends ProviderCache
{

}

const API_URL = "https://gamesdb.gog.com/platforms/gog/external_releases"

export class GOGMetadataProvider extends MetadataProvider
{

	static identifier: string = "gog";
	static title: string = t("providerMetadataGOG");
	identifier: string = GOGMetadataProvider.identifier;
	title: string = GOGMetadataProvider.title;

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
			if (launchCommand.includes("gog-launcher.sh"))
				id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "gog-launcher.sh"), details?.strShortcutExe).trim();
			else if (launchCommand.includes("/command=runGame /gameId="))
				id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "/gameId="), "/path=").trim();
			else if (launchCommand.includes("heroic://launch/gog/"))
				id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "heroic://launch/gog/"), "\"").trim();

			const response = await fetchNoCors(`${API_URL}/${id}`);

			if (response.ok)
			{
				const result: GamesDBResult = await response.json();

				const devs: Developer[] = result.game.developers.map((dev) => ({name: dev.name, url: ""}));
				const pubs: Publisher[] = result.game.publishers.map((pub) => ({name: pub.name, url: ""}));

				const cats: (StoreCategory | CustomStoreCategory)[] = [CustomStoreCategory.NonSteam, CustomStoreCategory.GOG]

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
		const details = await getAppDetails(appId)
		let launchCommand: string
		if (details?.strShortcutLaunchOptions?.includes("%command%"))
			launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
		else
			launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`
		return !!launchCommand?.includes("gog-launcher.sh")
			   || !!launchCommand?.includes("/command=runGame /gameId=")
			   || !!launchCommand?.includes("heroic://launch/gog/");
	}

	settingsComponent(): FC
	{
		return () => undefined
	}
}