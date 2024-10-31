import {ID, MetadataData} from "../../../../../Interfaces";
import {ResolverCache, ResolverConfig} from "../../../../Resolver";
import {t} from "../../../../../useTranslations";
import {EGSMetadataProviderResolver} from "../EGSMetadataProviderResolver";
import {getLaunchCommand, isHeroicGame} from "../../../../../shortcuts";
import {removeAfterAndIncluding, removeBeforeAndIncluding} from "../../GamesDBResult";
import {getAppDetails} from "../../../../../util";
import {EGSMetadataProviderResolverConfigs} from "../EGSMetadataProvider";
import {callable} from "@decky/api";

export interface EGSMetadataProviderHeroicResolverConfig extends ResolverConfig
{
}

export interface EGSMetadataProviderHeroicResolverCache extends ResolverCache
{
}

export class EGSMetadataProviderHeroicResolver extends EGSMetadataProviderResolver
{
	static identifier: keyof EGSMetadataProviderResolverConfigs = "heroic";
	static title: string = t("providerMetadataEGS");
	identifier: keyof EGSMetadataProviderResolverConfigs = EGSMetadataProviderHeroicResolver.identifier;
	title: string = EGSMetadataProviderHeroicResolver.title;

	async test(appId: number): Promise<boolean>
	{
		return await isHeroicGame(appId);
	}

	async resolve(appId: number): Promise<ID | undefined>
	{
		const details = await getAppDetails(appId);
		if (details == null) return undefined;
		const launchCommand = await getLaunchCommand(appId);
		return removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "heroic://launch/legendary/"), "\"").trim();
	}

	private heroic_egs_data: (id: string) => Promise<{
		"namespace": string,
		"install_size": number,
		"install_date": number,
		'install_path': string
	}> = callable("heroic_egs_data");

	async apply(appId: number, data: MetadataData): Promise<void>
	{
		const id = await this.resolve(appId);
		if (!id) return;
		const egs_data = await this.heroic_egs_data(id+'');
		data.install_size = egs_data.install_size;
		data.install_date = egs_data.install_date;
	}
}