import {
	definePlugin, Plugin
} from "@decky/api";

import {
	name
} from "@decky/manifest"

import {
	version
} from "@decky/pkg"

import {FaDatabase} from "react-icons/fa";
import Logger from "./logger";
import {MetaDeckComponent} from "./metaDeckComponent";
import {AppDetailsStore, AppStore} from "./SteamTypes";
import {Mounts} from "./System";
import {Fragment, ReactNode} from "react";
import {MetaDeckState, MetaDeckStateContextProvider, Modules} from "./hooks/metadataContext";
import {EventBus} from "./events";
import {DialogButton, Navigation} from "@decky/ui";
import {BsGearFill} from "react-icons/bs";
import {SettingsComponent} from "./modules/SettingsComponent";
import {ProviderSettingsComponent} from "./modules/ProviderSettingsComponent";
import {Settings} from "./settings";

declare global
{
	let appStore: AppStore;
	let appDetailsStore: AppDetailsStore;

	let appDetailsCache: {
		SetCachedDataForApp(app_id: number, descriptions: string, number: number, descriptionsData: {
			strFullDescription: ReactNode;
			strSnippet: ReactNode
		} | {
			rgDevelopers: {
				strName: string,
				strURL: string
			}[],
			rgPublishers: {
				strName: string,
				strURL: string
			}[]
			rgFranchises: {
				strName: string,
				strURL: string
			}[]
		}): void;
	}

	// let collectionStore: CollectionStore;
	interface PluginLoader
	{
		plugins: Plugin[];
	}

	interface Window
	{
		DeckyPluginLoader: PluginLoader;

		MetaDeck__SECRET: {
			set bypassCounter(count: number)
		};
		MetaDeck: {
			Events: EventBus,
			State: MetaDeckState
			Modules: Modules,
			Settings: Settings
		} | undefined
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


export default definePlugin(() => {
	const logger = new Logger("Index");
	const eventBus = new EventBus();
	const mounts = new Mounts(eventBus, logger);
	const state = new MetaDeckState(mounts)
	window.MetaDeck__SECRET = {
		set bypassCounter(count: number)
		{
			state.modules.metadata.bypassBypass = count
		}
	}

	mounts.addMount({
		mount()
		{
			window.MetaDeck = {
				Events: eventBus,
				State: state,
				Modules: state.modules,
				Settings: state.settings
			}
		},
		dismount()
		{
			delete window.MetaDeck
		}
	})


	// const checkOnlineStatus = async () => {
	// 	try
	// 	{
	// 		const online = await fetchNoCors("https://example.com");
	// 		return online.ok && online.status >= 200 && online.status < 300; // either true or false
	// 	} catch (err)
	// 	{
	// 		return false; // definitely offline
	// 	}
	// }
	//
	// const waitForOnline = async () => {
	// 	while (!(await checkOnlineStatus()))
	// 	{
	// 		logger.debug("No internet connection, retrying...");
	// 		await sleep(1000);
	// 	}
	// }

	mounts.addPageMount("/metadeck/settings", () =>
		   <MetaDeckStateContextProvider metaDeckState={state}>
			   <SettingsComponent/>
		   </MetaDeckStateContextProvider>
	)

	mounts.addPageMount("/metadeck/:module", () =>
		   <MetaDeckStateContextProvider metaDeckState={state}>
			   <ProviderSettingsComponent/>
		   </MetaDeckStateContextProvider>
	)


	const unregister = mounts.register()

	return {
		name,
		version,
		content:
			   <MetaDeckStateContextProvider metaDeckState={state}>
				   <MetaDeckComponent/>
			   </MetaDeckStateContextProvider>,
		icon: <FaDatabase/>,
		titleView:
			   <Fragment>
				   <div style={{ marginRight: 'auto', flex: 0.9}}>{name}</div>
				   <DialogButton
						 style={{height: '28px', width: '40px', minWidth: 0, padding: '10px 12px'}}
						 onClick={() => {
							 Navigation.Navigate("/metadeck/settings")
						 }}
				   >
					   <BsGearFill style={{marginTop: '-4px', display: 'block'}}/>
				   </DialogButton>
			   </Fragment>,
		onDismount()
		{
			unregister();
		},
	};
});
