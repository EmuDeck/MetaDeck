import {Module, ModuleCache, ModuleConfig} from "../Module";

import {CompatdataData, SteamDeckCompatCategory} from "../../Interfaces";
import {CompatdataProvider} from "./CompatdataProvider";
import {FC, Fragment, ReactNode, useState} from "react";
import {Mounts} from "../../System";
import Logger from "../../logger";
import {routePatch} from "../../RoutePatches";
import {format, t} from "../../useTranslations";
import {Modules} from "../../MetaDeckState";
import {
	EmuDeckCompatdataProvider,
	EmuDeckCompatdataProviderCache,
	EmuDeckCompatdataProviderConfig
} from "./providers/EmuDeckCompatdataProvider";
import {afterPatch, PanelSectionRow, Patch, ToggleField} from "@decky/ui";
import {SteamAppDetails, SteamAppOverview} from "../../SteamTypes";

export interface CompatdataConfig extends ModuleConfig<CompatdataProviderConfigs, CompatdataProviderConfigTypes>
{
	verified: boolean,
	notes: boolean
}

export interface CompatdataCache extends ModuleCache<CompatdataProviderCaches, CompatdataProviderCacheTypes, CompatdataData>
{

}

export interface CompatdataProviderConfigs
{
	emudeck: EmuDeckCompatdataProviderConfig
}

export interface CompatdataProviderCaches
{
	emudeck: EmuDeckCompatdataProviderCache
}

export interface CompatdataProviderResolverConfigs
{
	emudeck: {}
}

export interface CompatdataProviderResolverCaches
{
	emudeck: {}
}

export type CompatdataProviderConfigTypes = CompatdataProviderConfigs[keyof CompatdataProviderConfigs]

export type CompatdataProviderCacheTypes = CompatdataProviderCaches[keyof CompatdataProviderCaches]


export class CompatdataModule extends Module<
	   CompatdataModule,
	   CompatdataProvider<any>,
	   CompatdataConfig,
	   CompatdataProviderConfigs,
	   CompatdataProviderConfigTypes,
	   CompatdataProviderResolverConfigs,
	   CompatdataCache,
	   CompatdataProviderCaches,
	   CompatdataProviderCacheTypes,
	   CompatdataProviderResolverCaches,
	   CompatdataData
>
{
	static identifier: string = "compatdata";
	static title: string = t("moduleCompatdata");
	identifier: string = CompatdataModule.identifier;
	title: string = CompatdataModule.title;
	logger: Logger = new Logger(CompatdataModule.identifier)

	providers: CompatdataProvider<any>[] = [
		new EmuDeckCompatdataProvider(this)
	];

	get config(): CompatdataConfig
	{
		return this.state.settings.config.modules.compatdata
	}

	get cache(): CompatdataCache
	{
		return this.state.settings.cache.modules.compatdata
	}

	dependencies: (keyof Modules)[] = [
		"metadata"
	];

	addMounts(mounts: Mounts): void
	{
		const module = this

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   appStore.allApps[0].__proto__,
					   "BIsModOrShortcut",

					   function (_, ret) {
						   if (!module.isValid)
							   return ret;
						   // @ts-ignore
						   const overview: SteamAppOverview = this
						   if (overview.app_type == 1073741824)
							   void module.applyOverview(overview);

						   return ret
					   }
				)
			}
		})

		mounts.addMount(routePatch("/library/app/:appid", (props: { path?: string, children?: any }) => {
			afterPatch(props.children.props, "renderFunc", (_, ret) => {
				if (!module.isValid)
					return ret;
				const overview: SteamAppOverview = ret.props.children.props.overview;
				const details: SteamAppDetails = ret.props.children.props.details;

				void this.applyApp(overview, details)

				return ret;
			})
			return props;
		}));

		mounts.addMount(routePatch("/library", (props: { path?: string, children?: ReactNode }) => {
			afterPatch(props.children, "type", (_, ret) => {
				if (!module.isValid)
					return ret;

				for (const appId of this.state.apps)
					void this.apply(appId)

				return ret;
			})
			return props;
		}))
	}

	progressDescription(data?: CompatdataData): string
	{
		return format(t("foundCompatdata"), {
			0: t("unknown"),
			1: t("unsupported"),
			2: t("playable"),
			3: t("verified")
		}[data?.compat_category ?? SteamDeckCompatCategory.UNKNOWN]);
	}

	get verified(): boolean
	{
		return this.config.verified
	}

	set verified(verified: boolean)
	{
		this.config.verified = verified
	}

	get notes(): boolean
	{
		return this.config.notes
	}

	set notes(notes: boolean)
	{
		this.config.notes = notes
	}

	settingsComponent(): FC
	{
		return () => {
			const [verified, setVerified] = useState(this.verified)
			const [notes, setNotes] = useState(this.notes)

			return (
				   <Fragment>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("compatdataSettingsVerified")}
								 description={t("compatdataSettingsVerifiedDesc")}
								 checked={verified} onChange={(checked) => {
							   setVerified(checked);
							   this.verified = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("compatdataSettingsNotes")} disabled={!verified}
								 description={!verified ?
									    format(t("settingsDependencyNotMet"), t("compatdataSettingsNotes"), t("compatdataSettingsVerified"))
									    : t("compatdataSettingsNotesDesc")}
								 checked={notes} onChange={(checked) => {
							   setNotes(checked);
							   this.notes = checked;
						   }}/>
					   </PanelSectionRow>
				   </Fragment>
			)
		};
	}

	async applyOverview(overview: SteamAppOverview): Promise<void>
	{
		if (this.verified)
			overview.steam_hw_compat_category_packed = this.data[overview.appid]?.compat_category ?? SteamDeckCompatCategory.UNKNOWN
	}


	async applyDetails(details: SteamAppDetails): Promise<void>
	{
		const compatdata = this.data[details.unAppID]

		if (this.verified && this.notes && compatdata?.compat_notes)
		{
			details.vecDeckCompatTestResults = [{
				test_loc_token: compatdata.compat_notes,
				test_result: 1
			}];
		}
	}
}