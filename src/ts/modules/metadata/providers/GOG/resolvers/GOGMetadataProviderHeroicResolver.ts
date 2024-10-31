import {ID, MetadataData} from "../../../../../Interfaces";
import {ResolverCache, ResolverConfig} from "../../../../Resolver";
import {t} from "../../../../../useTranslations";
import {GOGMetadataProviderResolver} from "../GOGMetadataProviderResolver";
import {getLaunchCommand, isHeroicGame} from "../../../../../shortcuts";
import {removeAfterAndIncluding, removeBeforeAndIncluding} from "../../GamesDBResult";
import {getAppDetails} from "../../../../../util";
import {GOGMetadataProviderResolverConfigs} from "../GOGMetadataProvider";
import {callable} from "@decky/api";

export interface GOGMetadataProviderHeroicResolverConfig extends ResolverConfig
{
}

export interface GOGMetadataProviderHeroicResolverCache extends ResolverCache
{
}

export class GOGMetadataProviderHeroicResolver extends GOGMetadataProviderResolver
{
	static identifier: keyof GOGMetadataProviderResolverConfigs = "heroic";
	static title: string = t("providerMetadataGOG");
	identifier: keyof GOGMetadataProviderResolverConfigs = GOGMetadataProviderHeroicResolver.identifier;
	title: string = GOGMetadataProviderHeroicResolver.title;

	async test(appId: number): Promise<boolean>
	{
		return await isHeroicGame(appId);
	}

	async resolve(appId: number): Promise<ID | undefined>
	{
		const details = await getAppDetails(appId);
		if (details == null) return undefined;
		const launchCommand = await getLaunchCommand(appId);
		return removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "heroic://launch/gog/"), "\"").trim();
	}

	private heroic_gog_data: (id: number) => Promise<{
		"install_size": number,
		"install_date": number,
		'install_path': string
	}> = callable("heroic_gog_data");

	async apply(appId: number, data: MetadataData): Promise<void>
	{
		const id = await this.resolve(appId);
		if (!id) return;
		const gog_data = await this.heroic_gog_data(+id);
		data.install_size = gog_data.install_size;
		data.install_date = gog_data.install_date;
	}
}