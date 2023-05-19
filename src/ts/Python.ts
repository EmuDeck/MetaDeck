import {ServerAPI} from "decky-frontend-lib";
import {HTTPResult, MetadataData, MetadataDictionary, MetadataIdDictionary} from "./Interfaces";
import {toNumber} from "lodash-es";

export async function get_metadata(serverAPI: ServerAPI)
{
	return new Promise<MetadataDictionary>(async (resolve, reject) =>
	{

		let result = await serverAPI.callPluginMethod<{}, number[]>("get_metadata_keys", {});
		if (result.success)
		{
			let metadata: MetadataDictionary = {};
			for (const key of result.result)
			{
				let result = await serverAPI.callPluginMethod<{
					key: number
				}, MetadataData>("get_metadata_for_key", {
					key: key,
				});
				if (result.success)
				{
					metadata[key] = result.result;
				} else
				{
					reject(new Error(result.result));
				}
			}
			resolve(metadata);
		}
		else reject(new Error(result.result));
	});
}

export async function set_metadata(serverAPI: ServerAPI, metadata: MetadataDictionary)
{
	return new Promise<void>(async (resolve, reject) =>
	{
		for (const [key, value] of Object.entries(metadata))
		{
			let result = await serverAPI.callPluginMethod<{
				key: number,
				metadata: MetadataData,
			}, void>("set_metadata_for_key", {
				key: toNumber(key),
				metadata: value
			});
			if (!result.success)
			{
				reject(new Error(result.result));
			}
		}
		resolve();
	});
}

export async function get_metadata_id(serverAPI: ServerAPI)
{
	return new Promise<MetadataIdDictionary>(async (resolve, reject) =>
	{
		let result = await serverAPI.callPluginMethod<{}, MetadataIdDictionary>("get_metadata_id", {});
		if (result.success)
		{
			resolve(result.result);
		}
		else reject(new Error(result.result));
	});
}

export async function set_metadata_id(serverAPI: ServerAPI, metadata_id: MetadataIdDictionary)
{
	return new Promise<void>(async (resolve, reject) =>
	{
		let result = await serverAPI.callPluginMethod<{
			metadata_id: MetadataIdDictionary,
		}, void>("set_metadata_id", {
			metadata_id
		});
		if (result.success)
		{
			resolve(result.result);
		}
		else reject(new Error(result.result));
	});
}

let _token: string;

export async function authenticate_igdb(serverAPI: ServerAPI): Promise<{ client_id: string, token: string }>
{
	return new Promise<{ client_id: string, token: string }>(async (resolve, reject) =>
	{
		if (!!_token)
		{
			resolve({
				client_id: "6r74wqepr75dnspj9s2eekwq1kx4vq",
				token: _token
			});
		} else
		{
			let result = await serverAPI.fetchNoCors<HTTPResult>(`https://id.twitch.tv/oauth2/token?client_id=6r74wqepr75dnspj9s2eekwq1kx4vq&client_secret=tdkc4w5woirkk006ecokdy0q15ocfx&grant_type=client_credentials`)
			if (result.success)
			{
				try
				{
					_token = JSON.parse(result.result.body).access_token ?? "";
					resolve({
						client_id: "6r74wqepr75dnspj9s2eekwq1kx4vq",
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