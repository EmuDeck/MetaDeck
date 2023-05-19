import {
	afterPatch, beforePatch,
	callOriginal,
	definePlugin, Focusable, Navigation, Patch,
	replacePatch, Router, ServerAPI, sleep,


} from "decky-frontend-lib";
import {FaDatabase} from "react-icons/fa";

import {MetadataManager} from "./MetadataManager";
import {Title} from "./Title";
import {App} from "./App";
import Logger from "./logger";
import contextMenuPatch, {getMenu} from "./contextMenuPatch";
import {getTranslateFunc} from "./useTranslations";
import {AppDetailsStore, AppStore, CollectionStore, SteamAppOverview} from "./SteamTypes";
import {EventBus, MountManager} from "./System";
import {FunctionComponent, ReactNode, useRef} from "react";
import {ReactMarkdown, ReactMarkdownOptions} from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import {patchAppPage} from "./RoutePatches";

interface Plugin
{
	name: string;
	version?: string;
	icon: JSX.Element;
	content?: JSX.Element;

	onDismount?(): void;

	alwaysRender?: boolean;
}

interface PluginLoader
{
	plugins: Plugin[];
}

declare global
{
	let appStore: AppStore;
	let appDetailsStore: AppDetailsStore;

	let appDetailsCache: any

	let collectionStore: CollectionStore;


	interface Window
	{
		DeckyPluginLoader: PluginLoader;
	}
}

// const AppDetailsSections = findModuleChild((m) =>
// {
// 	if (typeof m!=='object') return;
// 	for (const prop in m)
// 	{
// 		if (
// 				m[prop]?.toString &&
// 				m[prop].toString().includes("bShowGameInfo")
// 		) return m[prop];
// 	}
// 	return;
// });

// const AppInfoContainer = findModuleChild((m) =>
// {
// 	if (typeof m!=='object') return;
// 	for (const prop in m)
// 	{
// 		if (
// 				m[prop]?.toString &&
// 				m[prop].toString().includes("m_contentRef")
// 		) return m[prop];
// 	}
// 	return;
// });

interface MarkdownProps extends ReactMarkdownOptions {
	onDismiss?: () => void;
}

const Markdown: FunctionComponent<MarkdownProps> = (props) => {
	return (
			<Focusable>
				<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							div: (nodeProps) => <Focusable {...nodeProps.node.properties}>{nodeProps.children}</Focusable>,
							a: (nodeProps) => {
								const aRef = useRef<HTMLAnchorElement>(null);
								return (
										// TODO fix focus ring
										<Focusable
												onActivate={() => {}}
												onOKButton={() => {
													props.onDismiss?.();
													Navigation.NavigateToExternalWeb(aRef.current!.href);
												}}
												style={{ display: 'inline' }}
										>
											<a ref={aRef} {...nodeProps.node.properties}>
												{nodeProps.children}
											</a>
										</Focusable>
								);
							},
						}}
						{...props}
				>{props.children}</ReactMarkdown>
			</Focusable>
	);
};

export default definePlugin((serverAPI: ServerAPI) =>
{
	const logger = new Logger("Index");
	const metadataManager = new MetadataManager(serverAPI);

	const eventBus = new EventBus()
	const mountManager = new MountManager(eventBus, logger)
	let bypassCounter = 0;

	const checkOnlineStatus = async () =>
	{
		try
		{
			const online = await serverAPI.fetchNoCors<{ body: string; status: number }>("https://example.com");
			return online.success && online.result.status >= 200 && online.result.status < 300; // either true or false
		} catch (err)
		{
			return false; // definitely offline
		}
	}

	const waitForOnline = async () =>
	{
		while (!(await checkOnlineStatus()))
		{
			logger.debug("No internet connection, retrying...");
			await sleep(1000);
		}
	}

	mountManager.addPatchMount({
		patch(): Patch {
			return replacePatch(
					appDetailsCache,
					"SetCachedDataForApp",
					function ([e, t, r, i]) {
						// @ts-ignore
						this.m_mapAppDetailsCache.has(e) || this.m_mapAppDetailsCache.set(e, new Map),
								// @ts-ignore
								this.m_mapAppDetailsCache.get(e).set(t, {
									version: r,
									data: i
								});
						// @ts-ignore
						let n = this.m_mapAppDetailsCache.get(e);
						// if (appStore.GetAppOverviewByAppID(e).app_type !== 1073741824)
							// return SteamClient.Apps.SetCachedAppDetails(e, JSON.stringify(Array.from(n)))
					}

			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return replacePatch(
					// @ts-ignore
					appDetailsStore.__proto__,
					"GetDescriptions",
					(args) =>
					{
						const overview = appStore.GetAppOverviewByAppID(args[0])
						if (overview.app_type==1073741824)
						{
							let appData = appDetailsStore.GetAppData(args[0])
							if (appData && !appData?.descriptionsData)
							{
								const t = getTranslateFunc()
								const data = metadataManager.fetchMetadata(args[0])
								const desc = data?.description ?? t("noDescription");
								logger.debug(desc);
								appData.descriptionsData = {
									strFullDescription: <Markdown>
										{`# ${overview.display_name}\n` + desc}
									</Markdown>,
									strSnippet: <Markdown>
										{`# ${overview.display_name}\n` + desc}
									</Markdown>
								}
								appDetailsCache.SetCachedDataForApp(args[0], "descriptions", 1, appData.descriptionsData)
							}
						}
						return callOriginal;
					}
			)
		}
	})

	mountManager.addPatchMount({
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
					} =>
					{
						const overview = appStore.GetAppOverviewByAppID(args[0])
						if (overview.app_type!=1073741824)
						{
							return {
								strFullDescription: <Markdown>
									{`# ${overview.display_name}\n` + ret?.strFullDescription}
								</Markdown>,
                                strSnippet: <Markdown>
	                                {`# ${overview.display_name}\n` + ret?.strSnippet}
                                </Markdown>
							}
						}
						return ret;
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return replacePatch(
					// @ts-ignore
					appStore.allApps[0].__proto__,
					"BHasStoreCategory",
					function (args)
					{
						// @ts-ignore
						if ((this as SteamAppOverview).app_type==1073741824)
						{
							// @ts-ignore
							const data = metadataManager.fetchMetadata((this as SteamAppOverview).appid)
							const categories = data?.store_categories ?? [];
							if (categories.includes(args[0]))
							{
								return true
							}
							logger.debug(`Categories ${categories}, ${data?.store_categories}`)
						}
						return callOriginal;
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return replacePatch(
					// @ts-ignore
					appDetailsStore.__proto__,
					"GetAssociations",
					(args) =>
					{
						if (appStore.GetAppOverviewByAppID(args[0]).app_type==1073741824)
						{
							let appData = appDetailsStore.GetAppData(args[0])
							if (appData && !appData?.associationData)
							{
								const data = metadataManager.fetchMetadata(args[0])
								const devs = data?.developers ?? [];
								const pubs = data?.publishers ?? [];
								logger.debug(devs, pubs)
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

	mountManager.addPatchMount({
		patch(): Patch
		{
			return afterPatch(
					// @ts-ignore
					appDetailsStore.__proto__,
					"BHasRecentlyLaunched",
					(args) =>
					{
						logger.log("Ran Game!!!", args[0])
						bypassCounter = 4
					}
			)
		}
	})

	mountManager.addPatchMount({
		async patch(): Promise<Patch>
		{
			const LibraryContextMenu = await getMenu()
			return contextMenuPatch(LibraryContextMenu, metadataManager)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return afterPatch(
					appStore.allApps[0].__proto__,
					"BIsModOrShortcut",
					function (_, ret)
					{
						if (ret===true)
						{
							// @ts-ignore
							if (Router?.WindowStore?.GamepadUIMainWindowInstance?.m_history?.location?.pathname === '/library/home' || metadataManager.bypassBypass > 0)
							{
								logger.log("Bypassing", metadataManager.bypassBypass)
								if (metadataManager.bypassBypass > 0)
									metadataManager.bypassBypass--
								return false;
							}
							if (bypassCounter > 0)
							{
								bypassCounter--;
								logger.debug(`bypassed ${_[0]}`)
							}
							return bypassCounter === -1 || bypassCounter > 0
						}
						return ret;
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return beforePatch(
					appStore.allApps[0].__proto__,
					"GetGameID",
					function (_)
					{
						bypassCounter = -1
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return afterPatch(
					appStore.allApps[0].__proto__,
					"GetGameID",
					function (_, ret)
					{
						bypassCounter = 0
						return ret;
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return beforePatch(
					appStore.allApps[0].__proto__,
					"GetPrimaryAppID",
					function (_)
					{
						bypassCounter = -1
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return afterPatch(
					appStore.allApps[0].__proto__,
					"GetPrimaryAppID",
					function (_, ret)
					{
						bypassCounter = 0
						return ret;
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return afterPatch(
					appStore.allApps[0].__proto__,
					"GetCanonicalReleaseDate",
					function (_, ret)
					{
						logger.log(ret);
						// @ts-ignore
						if (this.app_type==1073741824)
						{
							// @ts-ignore
							const data = metadataManager.fetchMetadata(this.appid);
							logger.log("data", data);
							if (data?.release_date)
							{
								return data?.release_date
							}
						}
						return ret;
					}
			)
		}
	})

	mountManager.addPatchMount({
		patch(): Patch
		{
			return afterPatch(
					appStore.allApps[0].__proto__,
					"GetPerClientData",
					function (_, ret)
					{
						bypassCounter = 4;
						return ret;
					}
			)
		}
	})

	// const appInfoHook = afterPatch(AppInfoContainer.prototype, 'render', (_: Record<string, unknown>[], component1: any) =>
	// {
	// 	const element = findInReactTree(component1, x => x?.props?.overview);
	// 	logger.log(element.props.overview)
	//
	// 	return component1;
	// });

	mountManager.addMount(patchAppPage(serverAPI, metadataManager));

	mountManager.addMount({
		mount: async function (): Promise<void> {
			if (await checkOnlineStatus())
			{
				await metadataManager.init();
			} else
			{
				await waitForOnline();
				await metadataManager.init();
			}
		},
		unMount: async function (): Promise<void> {
			await metadataManager.deinit();
		}
	});

	const unregister = mountManager.register()

	return {
		title: <Title>MetaDeck</Title>,
		content: <App serverAPI={serverAPI} metadataManager={() => metadataManager}/>,
		icon: <FaDatabase/>,
		onDismount()
		{
			metadataManager.deinit().then(() =>
			{
				unregister();
			});
		},
	};
});
