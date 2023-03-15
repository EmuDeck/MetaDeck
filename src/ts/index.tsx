import {
	afterPatch,
	callOriginal,
	definePlugin, fakeRenderComponent,
	findInReactTree, findInTree,
	findModuleChild, MenuItem,
	Patch,
	replacePatch,
	ServerAPI, showModal,


} from "decky-frontend-lib";
import {FaDatabase} from "react-icons/fa";

import {AppDetailsStore, AppStore} from "./AppStore";
import {AppOverview, SteamClient} from "./SteamClient";
import {MetadataManager} from "./MetadataManager";
import {Title} from "./Title";
import {App} from "./App";
import Logger from "./logger";
import {MetaDataModal} from "./MetaDataModal";

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

async function getMenu() {
	// @ts-ignore: decky global is not typed
	while (!window.DeckyPluginLoader?.routerHook?.routes) {
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	let LibraryContextMenu = findInReactTree(
			fakeRenderComponent(
					findInTree(
							fakeRenderComponent(
									// @ts-ignore: decky global is not typed
									window.DeckyPluginLoader.routerHook.routes.find((x) => x?.props?.path == '/zoo').props.children.type
							), (x) => x?.route === '/zoo/modals',
							{
								walkable: ['props', 'children', 'child', 'pages'],
							}
					).content.type
			),
			(x) => x?.title?.includes('AppActionsMenu')
	).children.type;

	if (!LibraryContextMenu?.prototype?.AddToHidden) {
		LibraryContextMenu = fakeRenderComponent(LibraryContextMenu).type;
	}
	return LibraryContextMenu;
}

const AppDetailsSections = findModuleChild((m) =>
{
	if (typeof m!=='object') return;
	for (const prop in m)
	{
		if (
				m[prop]?.toString &&
				m[prop].toString().includes("bShowGameInfo")
		) return m[prop];
	}
	return;
});

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

const spliceMetadataItem = (children: any[], appId: number, metadataManager: MetadataManager) =>
{
	children.splice(-1, 0, (
			<MenuItem
					key="metadeck-change-metadata"
					onSelected={async () =>
					{
						await showModal(
								<MetaDataModal appId={appId} manager={metadataManager} closeModal={() =>
								{
								}}/>
						)
					}}
			>
				{"Change Metadata..."}
			</MenuItem>
	));
};

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
					const data = metadataManager.fetchMetadata(args[0])
					const desc = data?.description ?? "No description found";
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
		patchedMenu = afterPatch(LibraryContextMenu.prototype, 'render', (_: Record<string, unknown>[], component: any) =>
		{
			const appid: number = component._owner.pendingProps.overview.appid;
			afterPatch(component.type.prototype, 'shouldComponentUpdate', ([nextProps]: any, shouldUpdate: any) => {
				if (shouldUpdate === true && !nextProps.children.find((x: any) => x?.key === 'metadeck-change-artwork')) {
					let updatedAppid: number = appid;
					// find the first menu component that has the correct appid assigned to _owner
					const parentOverview = nextProps.children.find((x: any) =>
							x?._owner?.pendingProps?.overview?.appid &&
							x._owner.pendingProps.overview.appid !== appid
					);
					// if found then use that appid
					if (parentOverview) {
						updatedAppid = parentOverview._owner.pendingProps.overview.appid;
					}
					spliceMetadataItem(nextProps.children, updatedAppid, metadataManager);
				}
				return shouldUpdate;
			}, { singleShot: true });

			spliceMetadataItem(component.props.children, appid, metadataManager);
			return component;
		});
	})
	const sectionHook = afterPatch(AppDetailsSections.prototype, 'render', (_: Record<string, unknown>[], component: any) =>
	{
		const overview: AppOverview = component._owner.pendingProps.overview;
		logger.log("AppDetailsSections", component._owner)
		logger.log(component._owner.pendingProps)
		if (overview.app_type===1073741824)
		{
			afterPatch(
					component._owner.type.prototype,
					"GetSections",
					(_: Record<string, unknown>[], ret3: Set<string>) =>
					{
						// ret3.delete("nonsteam");
						// ret3.add("info");
						logger.log(ret3);
						return ret3;
					}
			);
		}
		return component;
	});


	let count = 0;
	const shortcutHook = afterPatch(
			appStore.allApps[0].__proto__,
			"BIsModOrShortcut",
			function (_, ret)
			{
				if (ret===true)
				{
					const should_bypass = metadataManager.should_bypass
					if (should_bypass)
					{
						count++;
						if (count >= 10)
						{
							metadataManager.should_bypass = false;
							count = 0
						}
						logger.log(`bypassed ${_[0]}`)
					}
					return should_bypass
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

	metadataManager.init().then(() =>
	{
	})

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
				sectionHook?.unpatch();
				// appInfoHook?.unpatch();
			});
		},
	};
});
