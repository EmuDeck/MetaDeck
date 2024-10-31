import {Mountable} from "./System";
import Emittery from "emittery";
import Logger from "./logger";

// const CAppOverview_Change: {
// 	deserializeBinary(e: any): {
// 		add_app_overview(r: any, n: any): any
// 		add_removed_appid(t: any, r: any): any
// 		app_overview(): {
// 			appid(): number;
// 		}[]
// 		full_update(): any
// 		removed_appid(): any
// 		set_app_overview(r: any): any
// 		set_full_update(r: any): any
// 		set_removed_appid(r: any): any
// 		set_update_complete(r: any): any
// 		update_complete(): any
// 	}
// } = findModuleChild((m) => {
// 	if (typeof m !== 'object') return undefined;
// 	for (let prop in m)
// 	{
// 		if (m[prop]?.toString().includes("CAppOverview_Change")) return m[prop];
// 	}
// })

export type Event = {
	createdAt: number
}

export type Events = {
	Dismount: Event & { mounts: Mountable[] }
	Mount: Event & { mounts: Mountable[] }
	Update: Event
}

export class EventBus extends Emittery<Events>
{
	logger: Logger;

	constructor()
	{
		super();
		this.logger = new Logger("EventBus")
		this.register()
	}

	register()
	{
		this.onAny((eventName: keyof Events, eventData: Event) => {
			this.any(eventName, eventData)
		});
		// this.on(Emittery.listenerAdded, (eventData: ListenerChangedData) => {
		// 	this.listenerAdded(eventData)
		// });
	}

	any(eventName: keyof Events, eventData: Event)
	{
		this.logger.debug(`Emitted event ${eventName} at ${new Date(eventData.createdAt).toUTCString()}`)
	}

	// listenerAdded({eventName}: ListenerChangedData)
	// {
	// 	let name = eventName as (keyof Events) | undefined;
	// 	if (this.listenerCount(name) > 0)
	// 	switch (name)
	// 	{
	// 		case "AppOverviewChanged":
	// 		{
	// 			SteamClient.Apps.RegisterForAppOverviewChanges((e: any) => {
	// 				const i = CAppOverview_Change.deserializeBinary(e)
	// 				const s = i.app_overview()
	// 				for (const e of s)
	// 				{
	// 					void this.emit("AppOverviewChanged", {
	// 						createdAt: systemClock.getTimeMs(),
	// 						appid: e.appid()
	// 					})
	// 				}
	// 			})
	// 			break;
	// 		}
	// 	}
	// }
}