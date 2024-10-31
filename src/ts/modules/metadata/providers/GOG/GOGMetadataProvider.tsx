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
	isGOGGame
} from "../../../../shortcuts";
import {ResolverCache, ResolverConfig} from "../../../Resolver";
import {
	GOGMetadataProviderJunkStoreResolver,
	GOGMetadataProviderJunkStoreResolverCache,
	GOGMetadataProviderJunkStoreResolverConfig
} from "./resolvers/GOGMetadataProviderJunkStoreResolver";
import {GOGMetadataProviderResolver} from "./GOGMetadataProviderResolver";
import {
	GOGMetadataProviderNSLResolver,
	GOGMetadataProviderNSLResolverCache,
	GOGMetadataProviderNSLResolverConfig
} from "./resolvers/GOGMetadataProviderNSLResolver";
import {
	GOGMetadataProviderHeroicResolver,
	GOGMetadataProviderHeroicResolverCache,
	GOGMetadataProviderHeroicResolverConfig
} from "./resolvers/GOGMetadataProviderHeroicResolver";
import {MetadataProviderConfigs} from "../../MetadataModule";

export interface GOGMetadataProviderConfig extends ProviderConfig<GOGMetadataProviderResolverConfigs, GOGMetadataProviderResolverConfig>
{

}

export interface GOGMetadataProviderCache extends ProviderCache<GOGMetadataProviderResolverCaches, GOGMetadataProviderResolverCache>
{

}

export interface GOGMetadataProviderResolverConfigs
{
	junk: GOGMetadataProviderJunkStoreResolverConfig,
	nsl: GOGMetadataProviderNSLResolverConfig,
	heroic: GOGMetadataProviderHeroicResolverConfig
}

export interface GOGMetadataProviderResolverCaches
{
	junk: GOGMetadataProviderJunkStoreResolverCache,
	nsl: GOGMetadataProviderNSLResolverCache,
	heroic: GOGMetadataProviderHeroicResolverCache
}

export interface GOGMetadataProviderResolverConfig extends ResolverConfig
{
}

export interface GOGMetadataProviderResolverCache extends ResolverCache
{
}

const API_URL = "https://gamesdb.gog.com/platforms/gog/external_releases"

export class GOGMetadataProvider extends MetadataProvider<GOGMetadataProviderResolver>
{

	static identifier: keyof MetadataProviderConfigs = "gog";
	static title: string = t("providerMetadataGOG");
	identifier: keyof MetadataProviderConfigs = GOGMetadataProvider.identifier;
	title: string = GOGMetadataProvider.title;

	resolvers: GOGMetadataProviderResolver[] = [
		new GOGMetadataProviderJunkStoreResolver(this),
		new GOGMetadataProviderNSLResolver(this),
		new GOGMetadataProviderHeroicResolver(this)
	]

	async provide(appId: number): Promise<MetadataData | undefined>
	{
		return this.throttle(async () => {
			const details = await getAppDetails(appId);
			if (!details) return undefined;
			let id = await this.resolve(appId);
			if (!id) return;

			const response = await fetchNoCors(`${API_URL}/${id}`);

			if (response.ok)
			{
				const result: GamesDBResult = await response.json();

				const devs = result.game.developers.map<Developer>((dev) => ({name: dev.name, url: ""}));
				const pubs = result.game.publishers.map<Publisher>((pub) => ({name: pub.name, url: ""}));

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
		return await isGOGGame(appId);
	}

	settingsComponent(): FC
	{
		return () => undefined
	}
}