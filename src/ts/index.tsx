import {
	callOriginal,
	definePlugin, replacePatch,
	ServerAPI,
	Plugin

} from "decky-frontend-lib";
import {FaDatabase} from "react-icons/fa";

import {patchAppPage} from "./AppPatch";
import {AppDetailsStore, AppStore} from "./AppStore";
import {SteamClient} from "./SteamClient";
import {MetadataManager} from "./MetadataManager";
import {Title} from "./Title";
import {App} from "./App";

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
	interface Window {
		DeckyPluginLoader: PluginLoader;
	}
}

export default definePlugin((serverAPI: ServerAPI) =>
{
	const metadataManager = new MetadataManager(serverAPI);
	// let gameInfoTab = (findModuleChild(module =>
	// {
	// 	if (typeof module!=='object') return undefined;
	// 	for (let prop in module)
	// 	{
	// 		if (module[prop]?.OnPortraitContextMenu) return module[prop];
	// 	}
	// }));
	// metadataManager.patchGameInfo(gameInfoTab);
	let appPatch = patchAppPage(serverAPI, metadataManager);

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
					return {
						rgDevelopers: devs.map(value => ({
							strName: value.name,
							strURL: `https://thegamesdb.net/list_games.php?dev_id=${value.id}`
						})),
						rgPublishers: pubs.map(value => ({
							strName: value.name,
							strURL: `https://thegamesdb.net/list_games.php?pub_id=${value.id}`
						})),
						rgFranchises: []
					}
				}
				return callOriginal;
			}
	);

	metadataManager.init().then(() => {})

	return {
		title: <Title>MetaDeck</Title>,
		content: <App serverAPI={serverAPI}/>,
		icon: <FaDatabase/>,
		onDismount()
		{
			serverAPI.routerHook.removePatch("/library/app/:appid", appPatch);
			descHook.unpatch();
			assocHook.unpatch();
		},
	};
});
