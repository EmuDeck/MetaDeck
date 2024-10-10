import {MetaDeckState} from "./hooks/metadataContext";
import Logger from "./logger";
import {systemClock} from "./System";
import {callable} from "@decky/api";
import {ModuleCaches, ModuleConfigs} from "./modules/module";
import {merge} from "lodash-es";

export type ConfigData = {
	modules: ModuleConfigs
}

export type CacheData = {
	modules: ModuleCaches
}

export class Settings {
	private readonly state: MetaDeckState;
	private readonly logger: Logger;
	// private readonly mutex: Mutex = new Mutex();
	// private readonly packet_size: number = 50;

	private read_config = callable<[], ConfigData>("read_config")
	private write_config = callable<[ConfigData], void>("write_config")
	private read_cache = callable<[], CacheData>("read_cache")
	private write_cache = callable<[CacheData], void>("write_cache")

	static defaultConfig: ConfigData = {
		modules: {
			metadata: {
				enabled: true,
				type_override: true,
				descriptions: true,
				release_date: true,
				associations: true,
				categories: true,
				markdown: true,
				title_header: true,
				rating: true,
				install_size: true,
				install_date: true,
				providers: {
					epic: {
						enabled: true,
						ordinal: 0
					},
					gog: {
						enabled: true,
						ordinal: 1
					},
					igdb: {
						enabled: true,
						ordinal: 2,
						fuzziness: 5,
						overrides: {}
					}
				}
			},
			compatdata: {
				enabled: true,
				verified: true,
				notes: true,
				providers: {
					emudeck: {
						enabled: true,
						ordinal: 0,
						fuzziness: 5
					}
				}
			}
		}
	}

	static defaultCache: CacheData = {
		modules: {
			metadata: {
				ids: {},
				data: {},
				providers: {
					epic: {},
					gog: {},
					igdb: {}
				}
			},
			compatdata: {
				ids: {},
				data: {},
				providers: {
					emudeck: {}
				}
			}
		}
	}

	configData: ConfigData = merge({}, Settings.defaultConfig)

	cacheData: CacheData = merge({}, Settings.defaultCache)

	get config(): ConfigData
	{
		const self: Settings = this
		return {
			get modules(): ConfigData["modules"]
			{
				return self.getConfig("modules")
			},

			set modules(modules: ConfigData["modules"])
			{
				self.setConfig("modules", modules)
			}
		}
	}

	set config(data: ConfigData)
	{
		(Object.keys(data) as (keyof ConfigData)[]).forEach(key => {
			this.setConfig(key, data[key]);
		})
	}



	get cache(): CacheData
	{
		const self: Settings = this
		return {
			get modules(): CacheData["modules"]
			{
				return self.getCache("modules")
			},

			set modules(modules: CacheData["modules"])
			{
				self.setCache("modules", modules)
			}
		}
	}

	set cache(data: CacheData)
	{
		(Object.keys(data) as (keyof CacheData)[]).forEach(key => {
			this.setCache(key, data[key]);
		})
	}

	constructor(state: MetaDeckState)
	{
		this.state = state;
		this.logger = new Logger("Settings");
	}

	setConfig<T extends keyof ConfigData>(key: T, value: ConfigData[T])
	{
		if (this.configData.hasOwnProperty(key))
		{
			this.configData[key] = value;
			void this.writeConfig()
		}
		this.state.notifyUpdate()
		return this
	}

	getConfig<T extends keyof ConfigData>(key: T): ConfigData[T]
	{
		return this.configData[key];
	}

	setCache<T extends keyof CacheData>(key: T, value: CacheData[T])
	{
		if (this.cacheData.hasOwnProperty(key))
		{
			this.cacheData[key] = value;
			void this.writeCache()
		}
		this.state.notifyUpdate()
		return this
	}

	getCache<T extends keyof CacheData>(key: T): CacheData[T]
	{
		return this.cacheData[key];
	}

	async readSettings(): Promise<void>
	{
		this.logger.debug("Reading settings...");
		const start = systemClock.getTimeMs();
		await this.readConfig();
		await this.readCache();
		const end = systemClock.getTimeMs();
		this.logger.debug("Read settings in " + (end - start) + "ms");
	}

	async writeSettings(): Promise<void>
	{
		this.logger.debug("Writing settings...");
		const start = systemClock.getTimeMs();
		await this.writeConfig();
		await this.writeCache();
		const end = systemClock.getTimeMs();
		this.logger.debug("Wrote settings in " + (end - start) + "ms");
	}

	async readConfig(): Promise<void>
	{
		this.logger.debug("Reading config...");
		const start = systemClock.getTimeMs();
		merge(this.configData, Settings.defaultConfig, await this.read_config());
		const end = systemClock.getTimeMs();
		this.logger.debug("Read config in " + (end - start) + "ms");
	}

	async writeConfig(): Promise<void>
	{
		this.logger.debug("Writing config...");
		const start = systemClock.getTimeMs();
		await this.write_config(this.configData);
		const end = systemClock.getTimeMs();
		this.logger.debug("Wrote settings in " + (end - start) + "ms");
	}

	async readCache(): Promise<void>
	{
		this.logger.debug("Reading cache...");
		const start = systemClock.getTimeMs();
		merge(this.cacheData, Settings.defaultCache, await this.read_cache());
		const end = systemClock.getTimeMs();
		this.logger.debug("Read cache in " + (end - start) + "ms");
	}

	async writeCache(): Promise<void>
	{
		this.logger.debug("Writing cache...");
		const start = systemClock.getTimeMs();
		await this.write_cache(this.cacheData);
		const end = systemClock.getTimeMs();
		this.logger.debug("Wrote cache in " + (end - start) + "ms");
	}
}