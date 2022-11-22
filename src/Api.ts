import {debounce} from "lodash-es";
import {PlayTimes} from "./Interfaces";
import {ServerAPI, ServerResponse} from "decky-frontend-lib";

export const updatePlaytimesThrottled = debounce((serverAPI: ServerAPI) => updatePlaytimes(serverAPI), 1000, {leading: true});

export function updatePlaytimes(serverAPI: ServerAPI)
{
	serverAPI.callPluginMethod<{}, PlayTimes>("get_playtimes", {}).then((response: ServerResponse<PlayTimes>) =>
	{
		if (response.success)
		{
			console.log("MetaDeck playtimes", response.result);
			Object.entries(response.result).forEach(([key, value]) =>
			{
				try
				{
					let overview = appStore.GetAppOverviewByGameID(key)
					if (overview)
					{
						overview.minutes_playtime_forever = (value / 60.0).toFixed(1);
						console.log("MetaDeck", key, "played for", value, "seconds");
					}
				}
				catch (e)
				{
					console.log(e)
				}
			});
		}
	});
}