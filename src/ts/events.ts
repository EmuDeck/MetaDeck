import {findModuleChild} from "decky-frontend-lib";
import {AsyncEvent} from "ts-events";

const CAppOverview_Change: {
	deserializeBinary(e: any): {
		add_app_overview(r: any, n: any): any
		add_removed_appid(t: any, r: any): any
		app_overview(): any
		full_update(): any
		removed_appid(): any
		set_app_overview(r: any): any
		set_full_update(r: any): any
		set_removed_appid(r: any): any
		set_update_complete(r: any): any
		update_complete(): any
	}
} = findModuleChild((m) =>
{
	if (typeof m!=='object') return undefined;
	for (let prop in m)
	{
		if (m[prop]?.toString().includes("CAppOverview_Change")) return m[prop];
	}
})

export function RegisterEvents()
{
	Events.AppOverviewChange.evtListenersChanged.once(() =>
	{
		if (Events.AppOverviewChange.listenerCount() > 0)
		{
			SteamClient.Apps.RegisterForAppOverviewChanges((e: any) =>
			{
				const i = CAppOverview_Change.deserializeBinary(e)
				const s: any[] = i.app_overview()
				for (const e of s)
				{
					Events.AppOverviewChange.post(e.appid())
				}
			});
		}
	})
}

export const Events = {
	AppOverviewChange: new AsyncEvent<number>(),
}