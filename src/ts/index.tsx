import {
	afterPatch,
	callOriginal,
	definePlugin, Patch,
	replacePatch, Router,
	ServerAPI, SideMenu,


} from "decky-frontend-lib";
import {FaDatabase} from "react-icons/fa";

import {AppDetailsStore, AppStore} from "./AppStore";
import {SteamClient} from "./SteamClient";
import {MetadataManager} from "./MetadataManager";
import {Title} from "./Title";
import {App} from "./App";
import Logger from "./logger";
import contextMenuPatch, {getMenu} from "./contextMenuPatch";
import {getTranslateFunc} from "./useTranslations";

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
	// @ts-ignore
	let SteamClient: SteamClient;
	// @ts-ignore
	let appStore: AppStore;
	// @ts-ignore
	let appDetailsStore: AppDetailsStore;

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

export default definePlugin((serverAPI: ServerAPI) =>
{
	const logger = new Logger("Index");
	const metadataManager = new MetadataManager(serverAPI);

	const descHook = replacePatch(
			// @ts-ignore
			appDetailsStore.__proto__,
			"GetDescriptions",
			(args) =>
			{
				if (appStore.GetAppOverviewByAppID(args[0]).app_type==1073741824)
				{
					const t = getTranslateFunc()
					const data = metadataManager.fetchMetadata(args[0])
					const desc = data?.description ?? t("noDescription");
					logger.log(desc);
					return {
						strFullDescription: desc,
						strSnippet: desc
					}
				}
				return callOriginal;
			}
	);

	const assocHook = replacePatch(
			// @ts-ignore
			appDetailsStore.__proto__,
			"GetAssociations",
			(args) =>
			{
				if (appStore.GetAppOverviewByAppID(args[0]).app_type==1073741824)
				{
					const data = metadataManager.fetchMetadata(args[0])
					const devs = data?.developers ?? [];
					const pubs = data?.publishers ?? [];
					logger.log(devs, pubs)
					return {
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
				}
				return callOriginal;
			}
	);

	// const runGameHook = beforePatch(
	// 		runGame.m[runGame.prop].prototype,
	// 		"constructor",
	// 		() =>
	// 		{
	// 			metadataManager.should_bypass = true
	// 		}
	// )
	// logger.log("runGame", runGame)

	const launchedHook = afterPatch(
			// @ts-ignore
			appDetailsStore.__proto__,
			"BHasRecentlyLaunched",
			(args) =>
			{
				logger.log("Ran Game!!!", args[0])
				metadataManager.should_bypass = true
			}
	);

	let patchedMenu: Patch | undefined;
	getMenu().then((LibraryContextMenu) => {
		patchedMenu = contextMenuPatch(LibraryContextMenu, metadataManager);
	});

	let count = 0;
	const shortcutHook = afterPatch(
			appStore.allApps[0].__proto__,
			"BIsModOrShortcut",
			function (_, ret)
			{
				if (ret===true)
				{
					const side_menu_open = (Router?.WindowStore?.GamepadUIMainWindowInstance?.MenuStore as any)?.m_eOpenSideMenu == SideMenu.Main
					const should_bypass = metadataManager.should_bypass
					if (should_bypass)
					{
						count++;
						if (count >= 3)
						{
							metadataManager.should_bypass = false;
							count = 0
						}
						logger.log(`bypassed ${_[0]}`)
					}
					return should_bypass || side_menu_open
				}
				return ret;
			}
	);
	const releaseDateHook = afterPatch(
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
	);
	const perClientDataHook = afterPatch(
			appStore.allApps[0].__proto__,
			"GetPerClientData",
			function (_, ret)
			{
				metadataManager.should_bypass = true
				return ret;
			}
	);

	// const appInfoHook = afterPatch(AppInfoContainer.prototype, 'render', (_: Record<string, unknown>[], component1: any) =>
	// {
	// 	const element = findInReactTree(component1, x => x?.props?.overview);
	// 	logger.log(element.props.overview)
	//
	// 	return component1;
	// });

	void metadataManager.init();

	return {
		title: <Title>MetaDeck</Title>,
		content: <App serverAPI={serverAPI} metadataManager={() => metadataManager}/>,
		icon: <FaDatabase/>,
		onDismount()
		{
			metadataManager.deinit().then(() =>
			{
				descHook?.unpatch();
				assocHook?.unpatch();
				launchedHook?.unpatch();
				// killedHook?.unpatch();
				shortcutHook?.unpatch();
				releaseDateHook?.unpatch();
				perClientDataHook?.unpatch();
				patchedMenu?.unpatch();
				// sectionHook?.unpatch();
				// appInfoHook?.unpatch();
			});
		},
	};
});
