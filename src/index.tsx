import {
	callOriginal,
	definePlugin,
	replacePatch,
	ServerAPI,

} from "decky-frontend-lib";
import {FaDatabase} from "react-icons/fa";

import {patchAppPage} from "./AppPatch";
import {AppDetailsStore, AppStore} from "./AppStore";
import {Hook, SteamClient} from "./SteamClient";
import {MetadataManager} from "./MetadataManager";
import {GameActionStartParams} from "./Interfaces";
import {Title} from "./Title";
import {App} from "./App";
import {updatePlaytimesThrottled} from "./Api";

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
	let appStore: AppStore;
	let appDetailsStore: AppDetailsStore;
	interface Window {
		DeckyPluginLoader: PluginLoader;
	}
}

let isLoggedIn = false;


export default definePlugin((serverAPI: ServerAPI) =>
{
	const metadataManager = new MetadataManager(serverAPI);
	let appPatch = patchAppPage(serverAPI, metadataManager);

	let overviewHook: Hook | undefined;
	const lifetimeHook = SteamClient.GameSessions.RegisterForAppLifetimeNotifications((update: any) =>
	{
		console.log("MetaDeck AppLifetimeNotification", update);
		serverAPI.callPluginMethod("on_lifetime_callback", {data: update}).then(() =>
		{
			updatePlaytimesThrottled(serverAPI);
		});
	});
	const startHook = SteamClient.Apps.RegisterForGameActionStart((actionType: number, id: string, action: string) =>
	{
		console.log("MetaDeck GameActionStart", id);
		serverAPI.callPluginMethod<GameActionStartParams, {}>("on_game_start_callback", {
			idk: actionType,
			game_id: id,
			action: action
		}).then(() => updatePlaytimesThrottled(serverAPI));
	});
	const loginHook = SteamClient.User.RegisterForLoginStateChange((e: string) => {
		console.log("MetaDeck LoginStateChange", e)
		isLoggedIn = e !== "";
		if (isLoggedIn && overviewHook == undefined)
		{
			overviewHook = SteamClient.Apps.RegisterForAppOverviewChanges(() =>
			{
				console.log("MetaDeck AppOverviewChanges");
				updatePlaytimesThrottled(serverAPI);
			});
		}
		else if (!isLoggedIn && overviewHook != undefined)
		{
			overviewHook.unregister();
			overviewHook = undefined;
		}
	});

	const uiHook = SteamClient.Apps.RegisterForGameActionShowUI(() => updatePlaytimesThrottled(serverAPI));
	const suspendHook = SteamClient.System.RegisterForOnSuspendRequest(() =>
	{
		console.log("MetaDeck Suspend");
		serverAPI.callPluginMethod("on_suspend_callback", {}).then(() => updatePlaytimesThrottled(serverAPI));
	});
	const resumeHook = SteamClient.System.RegisterForOnResumeFromSuspend(() =>
	{
		console.log("MetaDeck Resume");
		serverAPI.callPluginMethod("on_resume_callback", {}).then(() => updatePlaytimesThrottled(serverAPI));
	});

	if (isLoggedIn)
		updatePlaytimesThrottled(serverAPI);

	const descHook = replacePatch(
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
		title: <Title>SeamlessTimes</Title>,
		content: <App serverAPI={serverAPI}/>,
		icon: <FaDatabase/>,
		onDismount()
		{
			serverAPI.routerHook.removePatch("/library/app/:appid", appPatch);
			descHook.unpatch();
			assocHook.unpatch();
			lifetimeHook!.unregister();
			startHook!.unregister();
			if (overviewHook)
				overviewHook.unregister();
			loginHook!.unregister();
			uiHook!.unregister();
			suspendHook!.unregister();
			resumeHook!.unregister();
		},
	};
});
