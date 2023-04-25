import Logger from "./logger";
import {SteamAppOverview} from "./SteamTypes";
import {Promise} from "bluebird";
import {registerForLoginStateChange, waitForServicesInitialized} from "./LibraryInitializer";
import { Patch } from "decky-frontend-lib";

let systemClock: Clock = {
	getTimeMs() {
		return Date.now()
	}
}

interface Clock {
	getTimeMs: () => number
}
export interface Mountable {
	mount(): void,
	unMount(): void
}

export interface PatchMountable {
	patch(): Patch
}

export interface AsyncMountable {
	mount(): Promise<void>,
	unMount(): Promise<void>
}

export interface AsyncPatchMountable
{
	patch(): Promise<Patch>
}

export type Events =
	   | { type: "GameStarted", createdAt: number, game: SteamAppOverview }
	   | { type: "GameStopped", createdAt: number, game: SteamAppOverview }
	   | { type: "Suspended", createdAt: number, game: SteamAppOverview | null }
	   | { type: "ResumeFromSuspend", createdAt: number, game: SteamAppOverview | null }
	   | { type: "Unmount", createdAt: number, mounts: Mountable[] }
	   | { type: "Mount", createdAt: number, mounts: Mountable[] }

export class MountManager
{
	private mounts: Array<Mountable | AsyncMountable> = []
	private logger: Logger;
	private eventBus: EventBus
	private clock: Clock;
	constructor(eventBus: EventBus, logger: Logger, clock: Clock = systemClock) {
		this.logger = logger;
		this.eventBus = eventBus
		this.clock = clock;
	}

	addMount(mount: Mountable | AsyncMountable): void {
		this.mounts.push(mount)
	}

	addPatchMount(mount: PatchMountable | AsyncPatchMountable): void {
		let patch: Patch;
		this.addMount({
			async mount()
			{
				return patch = (await mount.patch());
			},
			async unMount()
			{
				patch?.unpatch();
			}
		})
	}

	async mount() {
		await Promise.map(this.mounts, async (mount: Mountable | AsyncMountable) => await mount.mount(), { concurrency: 1 })
		this.eventBus.emit({ type: "Mount", createdAt: this.clock.getTimeMs(), mounts: this.mounts })
	}

	async unMount()
	{
		await Promise.map(this.mounts, async (mount: Mountable | AsyncMountable) => await mount.unMount(), { concurrency: 1 })
		this.eventBus.emit({ type: "Unmount", createdAt: this.clock.getTimeMs(), mounts: this.mounts })
	}

	register(): () => void
	{
		let self = this;
		return registerForLoginStateChange(
			   function (username) {
				   (async function () {
					   if (await waitForServicesInitialized())
					   {
						   self.logger.log(`Initializing plugin for ${username}`);
						   await self.mount()
					   }
				   })().catch(err => self.logger.error("Error while initializing plugin", err));
			   },
			   function () {
				   {
					   (async function () {
						   self.logger.log("Deinitializing plugin");
						   await self.unMount()
					   })().catch(err => self.logger.error("Error while deinitializing plugin", err));
				   }
			   }
		);
	}
}

export class EventBus {
	logger: Logger = new Logger("EventBus")
	private subscribers: ((event: Events) => void)[] = []

	public emit(event: Events): void {
		this.logger.log("New event", event)
		this.subscribers.forEach((it: (event: Events) => void): void => { it(event) })
	}

	public addSubscriber(subscriber: (event: Events) => void): void {
		this.subscribers.push(subscriber)
	}
}