import {ProviderCache, ProviderConfig} from "../../../Provider";
import {MetadataProvider} from "../../MetadataProvider";
import {Developer, MetadataData, Publisher, StoreCategory} from "../../../../Interfaces";
import {getAppDetails} from "../../../../util";
import {GamesDBResult} from "../GamesDBResult";
import {FC} from "react";
import {fetchNoCors} from "@decky/api";
import {t} from "../../../../useTranslations";
import {
	getShortcutCategories,
	isEpicGame
} from "../../../../shortcuts";
import {EGSMetadataProviderResolver} from "./EGSMetadataProviderResolver";
import {
	EGSMetadataProviderJunkStoreResolver, EGSMetadataProviderJunkStoreResolverCache,
	EGSMetadataProviderJunkStoreResolverConfig
} from "./resolvers/EGSMetadataProviderJunkStoreResolver";
import {ResolverCache, ResolverConfig} from "../../../Resolver";
import {
	EGSMetadataProviderNSLResolver, EGSMetadataProviderNSLResolverCache,
	EGSMetadataProviderNSLResolverConfig
} from "./resolvers/EGSMetadataProviderNSLResolver";
import {
	EGSMetadataProviderHeroicResolver, EGSMetadataProviderHeroicResolverCache,
	EGSMetadataProviderHeroicResolverConfig
} from "./resolvers/EGSMetadataProviderHeroicResolver";
import {MetadataProviderConfigs} from "../../MetadataModule";

export interface EGSMetadataProviderConfig extends ProviderConfig<EGSMetadataProviderResolverConfigs, EGSMetadataProviderResolverConfig>
{

}

export interface EGSMetadataProviderCache extends ProviderCache<EGSMetadataProviderResolverCaches, EGSMetadataProviderResolverCache>
{

}

export interface EGSMetadataProviderResolverConfigs
{
	junk: EGSMetadataProviderJunkStoreResolverConfig,
	nsl: EGSMetadataProviderNSLResolverConfig,
	heroic: EGSMetadataProviderHeroicResolverConfig
}

export interface EGSMetadataProviderResolverCaches
{
	junk: EGSMetadataProviderJunkStoreResolverCache,
	nsl: EGSMetadataProviderNSLResolverCache,
	heroic: EGSMetadataProviderHeroicResolverCache
}

export interface EGSMetadataProviderResolverConfig extends ResolverConfig
{
}

export interface EGSMetadataProviderResolverCache extends ResolverCache
{
}

const API_URL = "https://gamesdb.gog.com/platforms/epic/external_releases"

export class EGSMetadataProvider extends MetadataProvider<EGSMetadataProviderResolver>
{

	static identifier: keyof MetadataProviderConfigs = "egs";
	static title: string = t("providerMetadataEGS");
	identifier: keyof MetadataProviderConfigs = EGSMetadataProvider.identifier;
	title: string = EGSMetadataProvider.title;

	resolvers: EGSMetadataProviderResolver[] = [
		new EGSMetadataProviderJunkStoreResolver(this),
		new EGSMetadataProviderNSLResolver(this),
		new EGSMetadataProviderHeroicResolver(this)
	]

	async provide(appId: number): Promise<MetadataData | undefined>
	{
		return this.throttle(async () => {
			const details = await getAppDetails(appId);
			if (details == null) return undefined;
			// let launchCommand: string = ""
			// if (details?.strShortcutLaunchOptions?.includes("%command%"))
			// 	launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
			// else
			// 	launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`
			let id = await this.resolve(appId);
			// if (await isJunkStoreGame(appId))
			// 	id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "epic-launcher.sh"), details?.strShortcutExe).trim();
			// else if (await isNSLGame(appId))
			// 	id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "com.epicgames.launcher://apps/"), "?action").trim()
			// else if (await isHeroicGame(appId))
			// 	id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "heroic://launch/legendary/"), "\"").trim()

			const response = await fetchNoCors(`${API_URL}/${id}`);

			if (response.ok)
			{
				const result: GamesDBResult = await response.json();

				const devs: Developer[] = result.game.developers.map((dev) => ({name: dev.name, url: ""}));
				const pubs: Publisher[] = result.game.publishers.map((pub) => ({name: pub.name, url: ""}));

				const cats = await getShortcutCategories(appId);

				const modes = result.game_modes.map((mode) => mode.slug)

				if (modes.includes("multiplayer"))
					cats.push(StoreCategory.MultiPlayer)
				if (modes.includes("co-operative"))
					cats.push(StoreCategory.CoOp)
				if (modes.includes("single-player"))
					cats.push(StoreCategory.SinglePlayer)

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
		return await isEpicGame(appId);
	}

	settingsComponent(): FC
	{
		return () => undefined
	}
}