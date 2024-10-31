import {runInAction} from "mobx";
import {SteamAppDetails, SteamAppOverview} from "./SteamTypes";
import {closest, distance} from "fastest-levenshtein";

export function stateTransaction<T>(block: () => T) {
	// @ts-ignore
	const prev: boolean = window["__mobxGlobals"].allowStateChanges
	// @ts-ignore
	window["__mobxGlobals"].allowStateChanges = true
	const r = runInAction(block);
	// @ts-ignore
	window["__mobxGlobals"].allowStateChanges = prev
	return r;
}

export function getAllNonSteamAppIds(): number[]
{
	return appStore.allApps.filter(e => e.app_type == 1073741824).map(e => e.appid);
}

export function getAllNonSteamAppOverviews(): SteamAppOverview[]
{
	return appStore.allApps.filter(e => e.app_type == 1073741824)
}

export async function getAppDetails(appId: number): Promise<SteamAppDetails | null>
{
	return await new Promise((resolve) => {
		let timeoutId: NodeJS.Timeout | undefined = undefined;
		try {
			const { unregister } = SteamClient.Apps.RegisterForAppDetails(appId, (details: SteamAppDetails) => {
				clearTimeout(timeoutId);
				unregister();
				resolve(details);
			});

			timeoutId = setTimeout(() => {
				unregister();
				resolve(null);
			}, 1000);
		} catch (error) {
			clearTimeout(timeoutId);
			console.error(error);
			resolve(null);
		}
	});
}

export function closestWithLimit(limit: number, str: string, arr: string[]): string | undefined
{
	const newArr = arr.filter(value => distance(str, value) < limit)
	return newArr.length > 0 ? closest(str, newArr) : undefined
}

export function distanceWithLimit(limit: number, str: string, arr: string[]): string[]
{
	return arr.filter(value => distance(str, value) < limit)
}