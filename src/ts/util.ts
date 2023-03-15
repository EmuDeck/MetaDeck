import {AppDetails, AppOverview} from "./SteamClient";
import waitUntil from "async-wait-until";

export async function getAppDetails(appId: number): Promise<AppDetails | null> {
	return await new Promise((resolve) => {
		let timeoutId: number | undefined | NodeJS.Timeout = undefined;
		try {
			const { unregister } = SteamClient.Apps.RegisterForAppDetails(appId, (details: any) => {
				clearTimeout(timeoutId);
				unregister();
				resolve(details);
			});

			timeoutId = setTimeout(() => {
				unregister();
				resolve(null);
			}, 10000);
		} catch (error) {
			clearTimeout(timeoutId);
			resolve(null);
		}
	});
}

export async function getAppOverview(appId: number): Promise<AppOverview | null> {
	try {
		return await waitUntil<any>(() => {
			return appStore.GetAppOverviewByAppID(appId) ?? null as any;
		}, { timeout: 5000, intervalBetweenAttempts: 200 });
	} catch (err) {
		return null;
	}
}