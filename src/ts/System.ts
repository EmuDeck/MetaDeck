import {registerForLoginStateChange, waitForServicesInitialized} from "./LibraryInitializer";
import {ComponentType} from "react";
import {RouteProps} from "react-router";
import {EventBus} from "./events";
import {routerHook} from "@decky/api";
import {Patch} from "@decky/ui";
import Logger from "./logger";

export const systemClock: Clock = {
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

export class MountManager implements AsyncMountable
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

	addPageMount(path: string, component: ComponentType, props?: Omit<RouteProps, 'path' | 'children'>): void {
		this.addMount({
			mount(): void {
				routerHook.addRoute(path, component, props)
			},
			unMount(): void {
				routerHook.removeRoute(path)
			}
		})
	}

	async mount() {
		for (let mount of this.mounts) {
			await mount.mount()
		}
		await this.eventBus.emit("Mount", {createdAt: this.clock.getTimeMs(), mounts: this.mounts})
	}

	async unMount()
	{
		for (let mount of this.mounts) {
			await mount.unMount()
		}
		await this.eventBus.emit("Unmount", {createdAt: this.clock.getTimeMs(), mounts: this.mounts})
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