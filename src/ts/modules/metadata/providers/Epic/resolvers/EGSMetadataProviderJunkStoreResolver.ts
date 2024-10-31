import {ID, MetadataData} from "../../../../../Interfaces";
import {ResolverCache, ResolverConfig} from "../../../../Resolver";
import {t} from "../../../../../useTranslations";
import {EGSMetadataProviderResolver} from "../EGSMetadataProviderResolver";
import {getLaunchCommand, isJunkStoreGame} from "../../../../../shortcuts";
import {removeAfterAndIncluding, removeBeforeAndIncluding} from "../../GamesDBResult";
import {getAppDetails} from "../../../../../util";
import {EGSMetadataProviderResolverConfigs} from "../EGSMetadataProvider";
import {callable} from "@decky/api";

export interface EGSMetadataProviderJunkStoreResolverConfig extends ResolverConfig
{
}

export interface EGSMetadataProviderJunkStoreResolverCache extends ResolverCache
{
}

export class EGSMetadataProviderJunkStoreResolver extends EGSMetadataProviderResolver
{
	static identifier: keyof EGSMetadataProviderResolverConfigs = "junk";
	static title: string = t("providerMetadataEGS");
	identifier: keyof EGSMetadataProviderResolverConfigs = EGSMetadataProviderJunkStoreResolver.identifier;
	title: string = EGSMetadataProviderJunkStoreResolver.title;

	async test(appId: number): Promise<boolean>
	{
		return await isJunkStoreGame(appId);
	}

	async resolve(appId: number): Promise<ID | undefined>
	{
		const details = await getAppDetails(appId);
		if (details == null) return undefined;
		const launchCommand = await getLaunchCommand(appId);
		let exe: string;
		if (
			   details.strShortcutExe.replace(/['"]+/g, "").startsWith("/") ||
			   details.strShortcutExe.replace(/['"]+/g, "").startsWith("~") ||
			   details.strShortcutExe.replace(/['"]+/g, "").charAt(1) === ':'
		)
			exe = details.strShortcutExe;
		else
			exe = `${details.strShortcutStartDir}/${details.strShortcutExe}`
		return removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "epic-launcher.sh"), exe).trim();
	}

	private directory_size: (path: string) => Promise<number> = callable("directory_size");
	private file_date: (path: string) => Promise<number> = callable("file_date");

	async apply(appId: number, data: MetadataData): Promise<void>
	{
		const details = await getAppDetails(appId);
		if (!details) return;
		let exe: string;
		if (
			   details.strShortcutExe.replace(/['"]+/g, "").startsWith("/") ||
			   details.strShortcutExe.replace(/['"]+/g, "").startsWith("~") ||
			   details.strShortcutExe.replace(/['"]+/g, "").charAt(1) === ':'
		)
			exe = details.strShortcutExe;
		else
			exe = `${details.strShortcutStartDir}/${details.strShortcutExe}`
		data.install_size = await this.directory_size(exe.replace(/['"]+/g, ""));
		data.install_date = await this.file_date(exe.replace(/['"]+/g, ""));
	}
}