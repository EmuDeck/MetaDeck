import {Mountable} from "./System";
import {RoutePatch, routerHook} from "@decky/api";

export function routePatch(path: string, patch: RoutePatch): Mountable {
	return {
		mount() {
			routerHook.addPatch(path, patch)
		},
		dismount() {
			routerHook.removePatch(path, patch)
		}
	}
}