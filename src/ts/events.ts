import {findModuleChild} from "decky-frontend-lib";
import {SteamAppOverview} from "./SteamTypes";
import {Mountable, systemClock} from "./System";
import Emittery, {ListenerChangedData} from "emittery";
import {MetaDeckClient, yasdpl} from "../../lib/frontend";
import Logger = yasdpl.Logger;

const CAppOverview_Change: {
	deserializeBinary(e: any): {
		add_app_overview(r: any, n: any): any
		add_removed_appid(t: any, r: any): any
		app_overview(): {
			appid(): number;
		}[]
		full_update(): any
		removed_appid(): any
		set_app_overview(r: any): any
		set_full_update(r: any): any
		set_removed_appid(r: any): any
		set_update_complete(r: any): any
		update_complete(): any
	}
} = findModuleChild((m) => {
	if (typeof m !== 'object') return undefined;
	for (let prop in m)
	{
		if (m[prop]?.toString().includes("CAppOverview_Change")) return m[prop];
	}
})

export type Events = {
	GameStarted: { createdAt: number, game: SteamAppOverview }
	GameStopped: { createdAt: number, game: SteamAppOverview }
	Suspended: { createdAt: number, game: SteamAppOverview | null }
	ResumeFromSuspend: { createdAt: number, game: SteamAppOverview | null }
	Unmount: { createdAt: number, mounts: Mountable[] }
	Mount: { createdAt: number, mounts: Mountable[] }
	AppOverviewChanged: { createdAt: number, appid: number }
}

export class EventBus extends Emittery<Events>
{
	logger: Logger;

	constructor()
	{
		super();
		this.logger = new Logger(MetaDeckClient, "EventBus")
		this.register()
	}

	register()
	{
		this.onAny((eventName: keyof Events) => {
			this.any(eventName)
		});
		this.on(Emittery.listenerAdded, (eventData: ListenerChangedData) => {
			this.listenerAdded(eventData)
		});
	}

	any(eventName: keyof Events)
	{
		this.logger.debug(`Emitted event ${eventName}`)
	}

	listenerAdded({eventName}: ListenerChangedData)
	{
		let name = eventName as (keyof Events) | undefined;
		if (this.listenerCount(name) > 0)
		switch (name)
		{
			case "AppOverviewChanged":
			{
				SteamClient.Apps.RegisterForAppOverviewChanges((e: any) => {
					const i = CAppOverview_Change.deserializeBinary(e)
					const s = i.app_overview()
					for (const e of s)
					{
						void this.emit("AppOverviewChanged", {
							createdAt: systemClock.getTimeMs(),
							appid: e.appid()
						})
					}
				})
				break;
			}
		}
	}
}