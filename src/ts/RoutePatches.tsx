import {afterPatch, RoutePatch, ServerAPI} from "decky-frontend-lib";
import {Mountable} from "./System";
import {ReactElement} from "react";
import {MetadataManager} from "./MetadataManager";
import {SteamAppDetails, SteamAppOverview} from "./SteamTypes";
import {runInAction} from "mobx";

function routePatch(serverAPI: ServerAPI, path: string, patch: RoutePatch): Mountable {
	return {
		mount() {
			serverAPI.routerHook.addPatch(path, patch)
		},
		unMount() {
			serverAPI.routerHook.removePatch(path, patch)
		}
	}
}

export function patchAppPage(serverAPI: ServerAPI, metadataManager: MetadataManager): Mountable
{
	// @ts-ignore
	return routePatch(serverAPI, "/library/app/:appid", (props: { path: string, children: ReactElement }) =>
	{
		afterPatch(props.children.props, "renderFunc", (_, ret) =>
		{
			const overview: SteamAppOverview = ret.props.children.props.overview;
			const details: SteamAppDetails = ret.props.children.props.details;

			if (overview.app_type==1073741824)
			{
				metadataManager.bypassBypass = 11;
				const metadata = metadataManager.fetchMetadata(overview.appid)

					runInAction(() =>
					{
						if (metadata?.compat_notes)
						{
							details.vecDeckCompatTestResults = [{
								test_loc_token: metadata.compat_notes,
								test_result: 1
							}]
						}
					})
			}
			return ret;
		})
		return props;
	});
}