import {ServerAPI} from "decky-frontend-lib";
import {
	HTTPResult} from "./Interfaces";

let _token: string;

export async function authenticate_igdb(serverAPI: ServerAPI, id: string, secret: string): Promise<{ client_id: string, token: string }>
{
	return new Promise<{ client_id: string, token: string }>(async (resolve, reject) =>
	{
		// const id = "txpszfar9oph49to5i2kj41hk9mg4r"
		// const secret = "5i2jv9qtxur6uoue6il71sfqg0p8px"
		if (!!_token)
		{
			resolve({
				client_id: id,
				token: _token
			});
		} else
		{
			let result = await serverAPI.fetchNoCors<HTTPResult>(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`)
			if (result.success)
			{
				try
				{
					_token = JSON.parse(result.result.body).access_token ?? "";
					resolve({
						client_id: id,
						token: _token
					});
				} catch (e)
				{
					reject(e)
				}
			} else reject(new Error(result.result));
		}
	});
}