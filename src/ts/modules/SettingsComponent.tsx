import {FC} from "react";
import {useMetaDeckState} from "../hooks/metadataContext";
import {SidebarNavigation, SidebarNavigationPage} from "@decky/ui";
import {ModuleSettingsComponent} from "./ModuleSettingsComponent";
import {Module} from "./module";
import {Provider} from "./provider";

export const SettingsComponent: FC = () => {
	const state = useMetaDeckState();

	const pages: SidebarNavigationPage[] = [];

	for (let module of (Object.values(state.modules) as Module<any, Provider<any, any, any, any, any, any, any, any, any>, any, any, any, any, any, any, any>[]))
	{
		pages.push({
			title: module.title,
			content: <ModuleSettingsComponent module={module} providers={module.providers} />
		})
	}

	return <SidebarNavigation pages={pages} />
}