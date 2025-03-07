import {Module, ModuleCache, ModuleConfig} from "../Module";
import {MetadataProvider} from "./MetadataProvider";
import {
	IGDBMetadataProvider,
	IGDBMetadataProviderCache,
	IGDBMetadataProviderConfig
} from "./providers/IGDB/IGDBMetadataProvider";
import {CustomStoreCategory, MetadataData, StoreCategory} from "../../Interfaces";
import {
	EGSMetadataProvider,
	EGSMetadataProviderCache,
	EGSMetadataProviderConfig, EGSMetadataProviderResolverCaches, EGSMetadataProviderResolverConfigs
} from "./providers/Epic/EGSMetadataProvider";
import {truncate} from "lodash-es";
import {
	GOGMetadataProvider,
	GOGMetadataProviderCache,
	GOGMetadataProviderConfig, GOGMetadataProviderResolverCaches, GOGMetadataProviderResolverConfigs
} from "./providers/GOG/GOGMetadataProvider";
import {Mounts} from "../../System";
import {
	afterPatch,
	beforePatch,
	callOriginal,
	findInReactTree,
	findModuleExport,
	PanelSectionRow,
	Patch,
	replacePatch,
	Router,
	ToggleField
} from "@decky/ui";
import {format, t} from "../../useTranslations";
import {stateTransaction} from "../../util";
import {FC, Fragment, ReactElement, ReactNode, useState} from "react";
import {Markdown} from "../../markdown";
import {SteamAppDetails, SteamAppOverview} from "../../SteamTypes";
import {routePatch} from "../../RoutePatches";
// import {addStyle, removeStyle} from "../../styleInjector";
import Logger from "../../logger";
import {
	getShortcutCategories
} from "../../shortcuts";
import {CustomFeature} from "./CustomFeature";

// import mdx from "@mdxeditor/editor/style.css";

export interface MetadataConfig extends ModuleConfig<MetadataProviderConfigs, MetadataProviderConfigTypes>
{
	type_override: boolean,
	descriptions: boolean,
	release_date: boolean,
	associations: boolean,
	categories: boolean,
	markdown: boolean,
	title_header: boolean,
	rating: boolean,
	install_size: boolean,
	install_date: boolean
}

export interface MetadataCache extends ModuleCache<MetadataProviderCaches, MetadataProviderCacheTypes, MetadataData>
{

}

export interface MetadataProviderConfigs
{
	igdb: IGDBMetadataProviderConfig,
	gog: GOGMetadataProviderConfig,
	egs: EGSMetadataProviderConfig
}

export interface MetadataProviderCaches
{
	igdb: IGDBMetadataProviderCache,
	gog: GOGMetadataProviderCache,
	egs: EGSMetadataProviderCache
}

export interface MetadataProviderResolverConfigs
{
	igdb: {},
	gog: GOGMetadataProviderResolverConfigs,
	egs: EGSMetadataProviderResolverConfigs
}

export interface MetadataProviderResolverCaches
{
	igdb: {},
	gog: GOGMetadataProviderResolverCaches,
	egs: EGSMetadataProviderResolverCaches
}

export type MetadataProviderConfigTypes = MetadataProviderConfigs[keyof MetadataProviderConfigs]

export type MetadataProviderCacheTypes = MetadataProviderCaches[keyof MetadataProviderCaches]

export class MetadataModule extends Module<
	   MetadataModule,
	   MetadataProvider<any>,
	   MetadataConfig,
	   MetadataProviderConfigs,
	   MetadataProviderConfigTypes,
	   MetadataProviderResolverConfigs,
	   MetadataCache,
	   MetadataProviderCaches,
	   MetadataProviderCacheTypes,
	   MetadataProviderResolverCaches,
	   MetadataData
>
{
	static identifier: string = "metadata";
	static title: string = t("moduleMetadata");
	identifier: string = MetadataModule.identifier;
	title: string = MetadataModule.title;

	logger: Logger = new Logger(MetadataModule.identifier)

	providers: MetadataProvider<any>[] = [
		new EGSMetadataProvider(this),
		new GOGMetadataProvider(this),
		new IGDBMetadataProvider(this)
	];

	get config(): MetadataConfig
	{
		return this.state.settings.config.modules.metadata;
	}

	get cache(): MetadataCache
	{
		return this.state.settings.cache.modules.metadata;
	}

	public async removeCache(appId: number)
	{
		delete this.data[appId];
		await this.saveData();
		let appData = appDetailsStore.GetAppData(appId);
		if (appData)
		{
			const overview = appStore.GetAppOverviewByAppID(appId)
			const desc = this.descriptions ? t("noDescription") : "";
			stateTransaction(() => {
				if (this.config.markdown)
				{
					appData.descriptionsData = {
						strFullDescription: <Markdown>
							{this.config.title_header ? `# ${overview.display_name}\n` + desc : desc}
						</Markdown>,
						strSnippet: <Markdown>
							{this.config.title_header ? `# ${overview.display_name}\n` + desc : desc}
						</Markdown>
					}
				} else
				{
					appData.descriptionsData = {
						strFullDescription: desc,
						strSnippet: desc
					}
				}
				appData.associationData = {
					rgDevelopers: [],
					rgPublishers: [],
					rgFranchises: []
				}
				appDetailsCache.SetCachedDataForApp(appId, "descriptions", 1, appData.descriptionsData)
				appDetailsCache.SetCachedDataForApp(appId, "associations", 1, appData.associationData)
			});
		}
	};

	private bypassCounter = 0
	bypassBypass = 0

	addMounts(mounts: Mounts): void
	{
		const module = this
		mounts.addPatchMount({
			patch(): Patch
			{
				return replacePatch(
					   // @ts-ignore
					   appDetailsStore.__proto__,
					   "GetDescriptions",
					   (args) => {
						   if (!module.isValid)
							   return callOriginal;
						   const overview = appStore.GetAppOverviewByAppID(args[0])
						   if (overview.app_type == 1073741824)
						   {
							   let appData = appDetailsStore.GetAppData(args[0])
							   // if (appData && !appData?.descriptionsData)
							   if (appData)
							   {
								   const data = module.fetchData(args[0])
								   const desc = module.descriptions ? data?.description ?? t("noDescription") : "";
								   module.logger.debug(desc);
								   stateTransaction(() => {
									   appData.descriptionsData = {
										   strFullDescription: desc,
										   strSnippet: desc
									   }
									   appDetailsCache.SetCachedDataForApp(args[0], "descriptions", 1, appData.descriptionsData)
								   })

								   return appData.descriptionsData;
							   }
						   }
						   return callOriginal;
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   // @ts-ignore
					   appDetailsStore.__proto__,
					   "GetDescriptions",
					   (args, ret: {
						   strFullDescription: ReactNode,
						   strSnippet: ReactNode
					   }): {
						   strFullDescription: ReactNode,
						   strSnippet: ReactNode
					   } => {
						   if (!module.isValid)
							   return ret;
						   const overview = appStore.GetAppOverviewByAppID(args[0])
						   // if (overview.app_type != 1073741824)
						   // {
						   if (module.config.markdown)
							   return {
								   strFullDescription: <Markdown>
									   {module.config.title_header ? `# ${overview.display_name}\n` + ret?.strFullDescription as string : ret?.strFullDescription as string}
								   </Markdown>,
								   strSnippet: <Markdown>
									   {module.config.title_header ? `# ${overview.display_name}\n` + ret?.strSnippet as string : ret?.strSnippet as string}
								   </Markdown>
							   }
						   else
							   return ret
						   // }
						   // return ret;
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return replacePatch(
					   // @ts-ignore
					   appStore.allApps[0].__proto__,
					   "BHasStoreCategory",
					   function (args) {
						   if (!module.isValid || !module.categories)
							   return callOriginal;
						   // @ts-ignore
						   if ((this as SteamAppOverview).app_type == 1073741824)
						   {
							   // @ts-ignore
							   const data = module.fetchData((this as SteamAppOverview).appid)
							   const categories = data?.store_categories ?? [];
							   if (categories.includes(args[0]))
							   {
								   return true
							   }
							   module.logger.debug(`categories`, categories)
						   }
						   return callOriginal;
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return replacePatch(
					   // @ts-ignore
					   appDetailsStore.__proto__,
					   "GetAssociations",
					   (args) => {
						   if (!module.isValid || !module.associations)
							   return callOriginal;
						   if (appStore.GetAppOverviewByAppID(args[0]).app_type == 1073741824)
						   {
							   let appData = appDetailsStore.GetAppData(args[0])
							   if (appData && !appData?.associationData)
							   {
								   const data = module.fetchData(args[0])
								   const devs = data?.developers ?? [];
								   const pubs = data?.publishers ?? [];
								   module.logger.debug(`associations for ${args[0]}`, devs, pubs)
								   stateTransaction(() => {
									   appData.associationData = {
										   rgDevelopers: devs.map(value => ({
											   strName: value.name,
											   strURL: value.url
										   })),
										   rgPublishers: pubs.map(value => ({
											   strName: value.name,
											   strURL: value.url
										   })),
										   rgFranchises: []
									   }
									   appDetailsCache.SetCachedDataForApp(args[0], "associations", 1, appData.associationData)
								   })
							   }
						   }
						   return callOriginal;
					   }
				)
			}
		})

		// const runGameHook = beforePatch(
		// 		runGame.m[runGame.prop].prototype,
		// 		"constructor",
		// 		() =>
		// 		{
		// 			metadataManager.should_bypass = true
		// 		}
		// )
		// logger.log("runGame", runGame)

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   // @ts-ignore
					   appDetailsStore.__proto__,
					   "BHasRecentlyLaunched",
					   (_, ret) => {
						   if (!module.isValid)
							   return ret;
						   module.bypassCounter = 4
					   }
				)
			}
		})

		// mounts.addMount(contextMenuPatch(LibraryContextMenu))

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   appStore.allApps[0].__proto__,
					   "BIsModOrShortcut",
					   function (_, ret) {
						   if (!module.isValid || !module.typeOverride)
							   return ret;
						   if (ret === true)
						   {
							   if (module.bypassBypass > 0)
							   {
								   module.logger.debug("Bypassing", module.bypassBypass)
								   if (module.bypassBypass > 0)
									   module.bypassBypass--
								   return false;
							   }
							   // @ts-ignore
							   if (Router?.WindowStore?.GamepadUIMainWindowInstance?.m_history?.location?.pathname === '/library/home')
							   {
								   return false;
							   }
							   if (module.bypassCounter > 0)
							   {
								   module.bypassCounter--;
							   }
							   return module.bypassCounter === -1 || module.bypassCounter > 0
						   }
						   return ret;
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return beforePatch(
					   appStore.allApps[0].__proto__,
					   "GetGameID",
					   function (_) {
						   if (!module.isValid)
							   return;
						   module.bypassCounter = -1
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   appStore.allApps[0].__proto__,
					   "GetGameID",
					   function (_, ret) {
						   if (!module.isValid)
							   return ret;
						   module.bypassCounter = 0
						   return ret;
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return beforePatch(
					   appStore.allApps[0].__proto__,
					   "GetPrimaryAppID",
					   function (_) {
						   if (!module.isValid)
							   return;
						   module.bypassCounter = -1
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   appStore.allApps[0].__proto__,
					   "GetPrimaryAppID",
					   function (_, ret) {
						   if (!module.isValid)
							   return ret;
						   module.bypassCounter = 0
						   return ret;
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   appStore.allApps[0].__proto__,
					   "GetCanonicalReleaseDate",
					   function (_, ret) {
						   if (!module.isValid || !module.releaseDate)
							   return ret;
						   module.logger.debug(ret);
						   // @ts-ignore
						   if (this.app_type == 1073741824)
						   {
							   // @ts-ignore
							   const data = module.fetchData(this.appid);
							   module.logger.debug("data", data);
							   if (data?.release_date)
							   {
								   return data.release_date
							   }
						   }
						   return ret;
					   }
				)
			}
		})

		mounts.addPatchMount({
			patch(): Patch
			{
				return afterPatch(
					   appStore.allApps[0].__proto__,
					   "GetPerClientData",
					   function (_, ret) {
						   if (!module.isValid)
							   return ret;
						   module.bypassCounter = 4;
						   return ret;
					   }
				)
			}
		})


		// mounts.addPatchMount({
		// 	patch(): Patch
		// 	{
		// 		const CompatContainer = findModuleExport((e) => e?.toString().includes("SteamDeckCompatInfo"));
		// 		return afterPatch(fakeRenderComponent(() => <CompatContainer
		// 			   category={SteamDeckCompatCategory.UNKNOWN} className={""}/>), "type", (args, ret) => {
		// 			module.logger.debug("args", args);
		// 			module.logger.debug("ret", ret);
		// 			return ret;
		// 		});
		// 	}
		// })

		mounts.addPatchMount({
			patch(): Patch
			{
				const AppGameInfoContainer = findModuleExport((e) => e?.toString()?.includes("().AppGameInfoContainer"));
				module.logger.debug("AppGameInfoContainer", AppGameInfoContainer);


				return afterPatch(AppGameInfoContainer.prototype, "render", (_, ret) => {
					if (!module.isValid)
						return ret;

					const component = findInReactTree(ret, (e) => e?.props?.onImageLoad);

					beforePatch(component.type.prototype, "render", function (_) {
						//@ts-ignore
						this.m_bDelayedLoad = false
					})

					afterPatch(component.type.prototype, "render", function (_, ret) {
						if (!module.isValid || !ret)
							return ret;

						const featuresList = findInReactTree(ret, (e) => Array.isArray(e?.props?.children) && e?.props?.children?.length > 10);
						const overview: SteamAppOverview = featuresList?.props?.children?.[0]?.props?.overview

						for (const category of Object.values(CustomStoreCategory))
						{
							if (typeof category != "string" && !(featuresList?.props?.children as Array<ReactElement>)?.some(value => value?.props?.feature == category))
							{
								(featuresList?.props?.children as Array<ReactElement>)?.push(<CustomFeature
									   feature={category} minimode={false} overview={overview}
									   suppresstooltip={true}/>);
							}
						}


						return ret;
					});
					return ret;
				});
			}
		});


		mounts.addMount(routePatch("/library/app/:appid", (tree: any) => {
			const routeProps = findInReactTree(tree, (x: any) => x?.renderFunc);

			afterPatch(routeProps, "renderFunc", (_, ret) => {
				if (!module.enabled)
					return ret;
				const overview: SteamAppOverview = ret.props.children.props.overview;
				const details: SteamAppDetails = ret.props.children.props.details;

				if (overview.app_type == 1073741824)
				{
					module.bypassBypass = 11;
					void this.applyApp(overview, details);
				}

				return ret;
			});

			return tree;
		}))

		mounts.addMount(routePatch("/library", (props: { path?: string, children?: ReactNode }) => {

			afterPatch(props.children, "type", (_, ret) => {
				if (!module.enabled)
					return ret;

				for (const appId of this.state.apps)
					void this.apply(appId)

				return ret;
			})
			return props;
		}))

		// mounts.addMount({
		// 	mount()
		// 	{
		// 		addStyle("mdx", mdx)
		// 	},
		// 	dismount()
		// 	{
		// 		removeStyle("mdx")
		// 	}
		// })
	}

	progressDescription(data?: MetadataData): string
	{
		return format(t("foundMetadata"), truncate(data?.description, {
			'length': 512,
			'omission': "..."
		}));
	}

	get typeOverride(): boolean
	{
		return this.config.type_override
	}

	set typeOverride(typeOverride: boolean)
	{
		this.config.type_override = typeOverride
	}

	get descriptions(): boolean
	{
		return this.config.descriptions
	}

	set descriptions(descriptions: boolean)
	{
		this.config.descriptions = descriptions
	}

	get releaseDate(): boolean
	{
		return this.config.release_date
	}

	set releaseDate(release_date: boolean)
	{
		this.config.release_date = release_date
	}

	get associations(): boolean
	{
		return this.config.associations
	}

	set associations(associations: boolean)
	{
		this.config.associations = associations
	}

	get categories(): boolean
	{
		return this.config.categories
	}

	set categories(categories: boolean)
	{
		this.config.categories = categories
	}

	get rating(): boolean
	{
		return this.config.rating
	}

	set rating(rating: boolean)
	{
		this.config.rating = rating
	}

	get installSize(): boolean
	{
		return this.config.install_size
	}

	set installSize(install_size: boolean)
	{
		this.config.install_size = install_size
	}

	get installDate(): boolean
	{
		return this.config.install_date
	}

	set installDate(install_date: boolean)
	{
		this.config.install_date = install_date
	}

	get markdown(): boolean
	{
		return this.config.markdown
	}

	set markdown(markdown: boolean)
	{
		this.config.markdown = markdown
	}

	get titleHeader(): boolean
	{
		return this.config.title_header
	}

	set titleHeader(title_header: boolean)
	{
		this.config.title_header = title_header
	}

	settingsComponent(): FC
	{
		return () => {
			const [typeOverride, setTypeOverride] = useState(this.typeOverride)
			const [descriptions, setDescriptions] = useState(this.descriptions)
			const [releaseDate, setReleaseDate] = useState(this.releaseDate)
			const [associations, setAssociations] = useState(this.associations)
			const [categories, setCategories] = useState(this.categories)
			const [rating, setRating] = useState(this.rating)
			const [installSize, setInstallSize] = useState(this.installSize)
			const [installDate, setInstallDate] = useState(this.installDate)
			const [markdown, setMarkdown] = useState(this.markdown)
			const [titleHeader, setTitleHeader] = useState(this.titleHeader)

			return (
				   <Fragment>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsTypeOverride")}
								 description={t("metadataSettingsTypeOverrideDesc")}
								 checked={typeOverride} onChange={(checked) => {
							   setTypeOverride(checked);
							   this.typeOverride = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsDescriptions")} disabled={!typeOverride}
								 description={!typeOverride ?
									    format(t("settingsDependencyNotMet"), t("metadataSettingsDescriptions"), t("metadataSettingsTypeOverride"))
									    : t("metadataSettingsDescriptionsDesc")}
								 checked={descriptions} onChange={(checked) => {
							   setDescriptions(checked);
							   this.descriptions = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsReleaseDate")} disabled={!typeOverride}
								 description={!typeOverride ?
									    format(t("settingsDependencyNotMet"), t("metadataSettingsReleaseDate"), t("metadataSettingsTypeOverride"))
									    : t("metadataSettingsReleaseDateDesc")}
								 checked={releaseDate} onChange={(checked) => {
							   setReleaseDate(checked);
							   this.releaseDate = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsAssociations")} disabled={!typeOverride}
								 description={!typeOverride ?
									    format(t("settingsDependencyNotMet"), t("metadataSettingsAssociations"), t("metadataSettingsTypeOverride"))
									    : t("metadataSettingsAssociationsDesc")}
								 checked={associations} onChange={(checked) => {
							   setAssociations(checked);
							   this.associations = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsCategories")}
								 description={t("metadataSettingsCategoriesDesc")}
								 checked={categories} onChange={(checked) => {
							   setCategories(checked);
							   this.categories = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsRating")}
								 description={t("metadataSettingsRatingDesc")}
								 checked={rating} onChange={(checked) => {
							   setRating(checked);
							   this.rating = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsInstallSize")}
								 description={t("metadataSettingsInstallSizeDesc")}
								 checked={installSize} onChange={(checked) => {
							   setInstallSize(checked);
							   this.installSize = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsInstallDate")}
								 description={t("metadataSettingsInstallDateDesc")}
								 checked={installDate} onChange={(checked) => {
							   setInstallDate(checked);
							   this.installDate = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsMarkdown")}
								 description={t("metadataSettingsMarkdownDesc")}
								 checked={markdown} onChange={(checked) => {
							   setMarkdown(checked);
							   this.markdown = checked;
						   }}/>
					   </PanelSectionRow>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("metadataSettingsTitleHeader")} disabled={!markdown}
								 description={!markdown ?
									    format(t("settingsDependencyNotMet"), t("metadataSettingsTitleHeader"), t("metadataSettingsMarkdown"))
									    : t("metadataSettingsTitleHeaderDesc")}
								 checked={titleHeader} onChange={(checked) => {
							   setTitleHeader(checked);
							   this.titleHeader = checked;
						   }}/>
					   </PanelSectionRow>
				   </Fragment>
			);
		}
	}

	async applyOverview(overview: SteamAppOverview): Promise<void>
	{
		if (this.rating)
			overview.metacritic_score = this.data[overview.appid]?.rating;
		if (this.categories)
			this.data[overview.appid]?.store_categories?.forEach(category => overview.m_setStoreCategories.add(category));
		if (this.installSize)
			overview.size_on_disk = this.data[overview.appid]?.install_size?.toString() ?? "0"
		if (this.installDate)
			overview.rt_purchased_time = this.data[overview.appid]?.install_date
	}


	async provideDefault(appId: number): Promise<MetadataData | undefined>
	{
		const overview = appStore.GetAppOverviewByAppID(appId);
		const cats: (StoreCategory | CustomStoreCategory)[] = await getShortcutCategories(appId);

		return {
			title: overview.display_name,
			id: 0,
			description: t("noDescription"),
			store_categories: cats
		}
	}

	// private file_size: (path: string) => Promise<number> = callable("file_size");
	// private directory_size: (path: string) => Promise<number> = callable("directory_size");
	// private file_date: (path: string) => Promise<number> = callable("file_date");
	// private nsl_egs_data: (id: string) => Promise<{
	// 	"namespace": string,
	// 	"install_size": number,
	// 	"install_date": number,
	// 	'install_path': string
	// }> = callable("nsl_egs_data");
	// private nsl_gog_data: (id: number) => Promise<{
	// 	"install_size": number,
	// 	"install_date": number,
	// 	'install_path': string
	// }> = callable("nsl_gog_data");
	// private heroic_egs_data: (id: string) => Promise<{
	// 	"namespace": string,
	// 	"install_size": number,
	// 	"install_date": number,
	// 	'install_path': string
	// }> = callable("heroic_egs_data");
	// private heroic_gog_data: (id: number) => Promise<{
	// 	"install_size": number,
	// 	"install_date": number,
	// 	'install_path': string
	// }> = callable("heroic_gog_data");

	// private dirname(path: string): string
	// {
	// 	if (path.length === 0) return '.';
	// 	let code = path.charCodeAt(0);
	// 	let hasRoot = code === 47 /*/*/;
	// 	let end = -1;
	// 	let matchedSlash = true;
	// 	for (let i = path.length - 1; i >= 1; --i)
	// 	{
	// 		code = path.charCodeAt(i);
	// 		if (code === 47 /*/*/)
	// 		{
	// 			if (!matchedSlash)
	// 			{
	// 				end = i;
	// 				break;
	// 			}
	// 		} else
	// 		{
	// 			// We saw the first non-path separator
	// 			matchedSlash = false;
	// 		}
	// 	}
	//
	// 	if (end === -1) return hasRoot ? '/' : '.';
	// 	if (hasRoot && end === 1) return '//';
	// 	return path.slice(0, end);
	// }

	// async provideAdditional(appId: number, _data: MetadataData): Promise<void>
	// {
	// 	const details = await getAppDetails(appId);
	// 	if (details)
	// 	{
	// 		// let launchCommand: string = await getLaunchCommand(appId);
	//
	// 		if (await isEmulatedGame(appId))
	// 		{
	// 			// data.install_size = await this.file_size(launchCommand.match(romRegex)?.[0]!!)
	// 			// data.install_date = await this.file_date(launchCommand.match(romRegex)?.[0]!!)
	// 		}
	// 		else if (await isJunkStoreGame(appId))
	// 		{
	// 			// data.install_size = await this.directory_size(details.strShortcutStartDir.replace(/['"]+/g, ""));
	// 			// data.install_date = await this.file_date(details.strShortcutExe.replace(/['"]+/g, ""));
	// 		}
	// 		else if (await isNSLGame(appId))
	// 		{
	// 			if (await isEpicGame(appId))
	// 			{
	// 				// const id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "com.epicgames.launcher://apps/"), "?action").trim();
	// 				// const egs_data = await this.nsl_egs_data(id);
	// 				// data.install_size = egs_data.install_size;
	// 				// data.install_date = egs_data.install_date;
	// 			}
	// 			else if (await isGOGGame(appId))
	// 			{
	// 				// const path = details.strShortcutStartDir.replace(/['"]+/g, "") + removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "/path=\"C:\\Program Files (x86)\\GOG Galaxy\\"), "\"").trim().replace(/\\+/g, "/");
	// 				// data.install_size = await this.directory_size(this.dirname(path));
	// 				// data.install_date = await this.file_date(path);
	// 				// const id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "/gameId="), "/path=").trim();
	// 				// const gog_data = await this.nsl_gog_data(+id);
	// 				// data.install_size = gog_data.install_size;
	// 				// data.install_date = gog_data.install_date;
	// 			}
	// 		}
	// 		else if (await isHeroicGame(appId))
	// 		{
	// 			if (await isEpicGame(appId))
	// 			{
	// 				// const id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "heroic://launch/legendary/"), "\"").trim();
	// 				// const egs_data = await this.heroic_egs_data(id);
	// 				// data.install_size = egs_data.install_size;
	// 				// data.install_date = egs_data.install_date;
	// 			}
	// 			else if (await isGOGGame(appId))
	// 			{
	// 				// const id = removeAfterAndIncluding(removeBeforeAndIncluding(launchCommand, "heroic://launch/gog/"), "\"").trim();
	// 				// const gog_data = await this.heroic_gog_data(+id);
	// 				// data.install_size = gog_data.install_size;
	// 				// data.install_date = gog_data.install_date;
	// 			}
	// 		}
	// 	}
	// }
}