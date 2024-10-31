import {ID, MetadataData} from "../../../../../Interfaces";
import {ResolverCache, ResolverConfig} from "../../../../Resolver";
import {t} from "../../../../../useTranslations";
import {GOGMetadataProviderResolver} from "../GOGMetadataProviderResolver";
import {getLaunchCommand, isNSLGame} from "../../../../../shortcuts";
import {removeAfterAndIncluding, removeBeforeAndIncluding} from "../../GamesDBResult";
import {getAppDetails} from "../../../../../util";
import {GOGMetadataProviderResolverConfigs} from "../GOGMetadataProvider";
import {callable} from "@decky/api";

export interface GOGMetadataProviderNSLResolverConfig extends ResolverConfig
{
}

export interface GOGMetadataProviderNSLResolverCache extends ResolverCache
{
}

export class GOGMetadataProviderNSLResolver extends GOGMetadataProviderResolver
{
	static identifier: keyof GOGMetadataProviderResolverConfigs = "nsl";
	static title: string = t("providerMetadataGOG");
	identifier: keyof GOGMetadataProviderResolverConfigs = GOGMetadataProviderNSLResolver.identifier;
	title: string = GOGMetadataProviderNSLResolver.title;

	async test(appId: number): Promise<boolean>
	{
		return await isNSLGame(appId);
	}

	async resolve(appId: number): Promise<ID | undefined>
	{
		const details = await getAppDetails(appId);
		if (details == null) return undefined;
		const launchCommand = await getLaunchCommand(appId);
		return removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "/gameId="), "/path=").trim();
	}

	private nsl_gog_data: (id: number) => Promise<{
		"install_size": number,
		"install_date": number,
		'install_path': string
	}> = callable("nsl_gog_data");

	async apply(appId: number, data: MetadataData): Promise<void>
	{
		const id = await this.resolve(appId);
		if (!id) return;
		const gog_data = await this.nsl_gog_data(+id);
		data.install_size = gog_data.install_size;
		data.install_date = gog_data.install_date;
	}
}