import {MetaDeckState} from "./hooks/metadataContext";
import {MetadataCustomDictionary, MetadataDictionary, MetadataIdDictionary} from "./Interfaces";
// import Logger from "./logger";
import {systemClock} from "./System";
import {MetaDeckClient, yasdpl} from "../../lib/frontend";
import Logger = yasdpl.Logger;

export type SettingsData = {
	metadata_id: MetadataIdDictionary,
	metadata_custom: MetadataCustomDictionary,
	metadata: MetadataDictionary
}

export class Settings {
	private readonly state: MetaDeckState;
	private readonly logger: Logger;
	// private readonly mutex: Mutex = new Mutex();
	// private readonly packet_size: number = 50;

	data: SettingsData = {
		metadata_id: {},
		metadata_custom: {},
		metadata: {}
	};

	get metadata_id(): MetadataIdDictionary {return this.get("metadata_id")}
	set metadata_id(metadata_id: MetadataIdDictionary) {this.set("metadata_id", metadata_id)}

	get metadata_custom(): MetadataCustomDictionary {return this.get("metadata_custom")}
	set metadata_custom(metadata_custom: MetadataCustomDictionary) {this.set("metadata_custom", metadata_custom)}

	get metadata(): MetadataDictionary {return this.get("metadata")}
	set metadata(metadata: MetadataDictionary) {this.set("metadata", metadata)}

	constructor(state: MetaDeckState, startingSettings: SettingsData = {} as SettingsData)
	{
		this.state = state;
		this.logger = new Logger(MetaDeckClient, "Settings");
		this.setMultiple(startingSettings);
	}

	set<T extends keyof SettingsData>(key: T, value: SettingsData[T])
	{
		if (this.data.hasOwnProperty(key))
		{
			this.data[key] = value;
		}
		this.state.notifyUpdate()
		return this
	}

	setMultiple(settings: SettingsData)
	{
		(Object.keys(settings) as (keyof SettingsData)[]).forEach((key: keyof SettingsData) => {
			this.set(key, settings[key]);
		})
		return this
	}

	get<T extends keyof SettingsData>(key: T): SettingsData[T]
	{
		return this.data[key];
	}

	async readSettings(): Promise<void>
	{
		// const release = await this.mutex.acquire();
		// let buffer = "";
		// let length = 0;
		// const startResponse = await this.serverAPI.callPluginMethod<{packet_size?: number}, number>("start_read_config", {packet_size: this.packet_size});
		// if (startResponse.success)
		// {
		// 	length = startResponse.result;
		// 	for (let i = 0; i < length; i++)
		// 	{
		// 		const response = await this.serverAPI.callPluginMethod<{
		// 			index: number
		// 		}, string>("read_config", {index: i});
		// 		if (response.success)
		// 		{
		// 			buffer += response.result;
		// 		} else
		// 		{
		// 			release()
		// 			throw new Error(response.result);
		// 		}
		// 	}
		// 	release()
		// 	this.logger.debug("readSettings", buffer);
		// 	this.data = JSON.parse(buffer);
		// } else
		// {
		// 	release()
		// 	throw new Error(startResponse.result);
		// }
		this.logger.debug("Reading settings...");
		const start = systemClock.getTimeMs();
		this.data = await MetaDeckClient.readConfig();
		const end = systemClock.getTimeMs();
		this.logger.debug("Read settings in " + (end - start) + "ms");
	}

	async writeSettings(): Promise<void>
	{
		// const release = await this.mutex.acquire();
		// const buffer = JSON.stringify(this.data, undefined, "\t")
		// const length = Math.ceil(buffer.length / this.packet_size)
		// const startResponse = await this.serverAPI.callPluginMethod<{
		// 	length: number,
		// 	packet_size?: number
		// }, void>("start_write_config", {length: length, packet_size: this.packet_size})
		// if (startResponse.success)
		// {
		// 	for (let i = 0; i < length; i++)
		// 	{
		// 		const data = buffer.slice(i * this.packet_size, (i + 1) * this.packet_size)
		// 		const response = await this.serverAPI.callPluginMethod<{
		// 			index: number,
		// 			data: string
		// 		}, void>("write_config", {index: i, data: data})
		// 		if (!response.success)
		// 		{
		// 			release()
		// 			throw new Error(response.result)
		// 		}
		// 	}
		// 	release()
		// } else
		// {
		// 	release()
		// 	throw new Error(startResponse.result)
		// }
		this.logger.debug("Writing settings...");
		const start = systemClock.getTimeMs();
		await MetaDeckClient.writeConfig(this.data);
		const end = systemClock.getTimeMs();
		this.logger.debug("Wrote settings in " + (end - start) + "ms");
	}
}