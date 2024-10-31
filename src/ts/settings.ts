import {MetaDeckState} from "./MetaDeckState";
import Logger from "./logger";
import {systemClock} from "./System";
import {callable} from "@decky/api";
import {ModuleCaches, ModuleConfigs} from "./modules/Module";
import {merge} from "lodash-es";

export type ConfigData = {
	modules: ModuleConfigs
}

export type CacheData = {
	modules: ModuleCaches
}

export class Settings
{
	private readonly state: MetaDeckState;
	private readonly logger: Logger;
	// private readonly mutex: Mutex = new Mutex();
	// private readonly packet_size: number = 50;

	private read_config = callable<[], ConfigData>("read_config")
	private write_config = callable<[ConfigData], void>("write_config")
	private read_cache = callable<[], CacheData>("read_cache")
	private write_cache = callable<[CacheData], void>("write_cache")

	static readonly defaultConfig: ConfigData = {
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
					egs: {
						enabled: true,
						ordinal: 0,
						resolvers: {
							junk: {
								enabled: true,
								ordinal: 0
							},
							nsl: {
								enabled: true,
								ordinal: 1
							},
							heroic: {
								enabled: true,
								ordinal: 2
							}
						}
					},
					gog: {
						enabled: true,
						ordinal: 1,
						resolvers: {
							junk: {
								enabled: true,
								ordinal: 0
							},
							nsl: {
								enabled: true,
								ordinal: 1
							},
							heroic: {
								enabled: true,
								ordinal: 2
							}
						}
					},
					igdb: {
						enabled: true,
						ordinal: 2,
						fuzziness: 5,
						overrides: {},
						resolvers: {}
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
						fuzziness: 5,
						resolvers: {}
					}
				}
			}
		}
	}

	static readonly defaultCache: CacheData = {
		modules: {
			metadata: {
				data: {},
				providers: {
					egs: {
						resolvers: {
							junk: {},
							nsl: {},
							heroic: {}
						}
					},
					gog: {
						resolvers: {
							junk: {},
							nsl: {},
							heroic: {}
						}
					},
					igdb: {
						resolvers: {}
					}
				}
			},
			compatdata: {
				data: {},
				providers: {
					emudeck: {
						resolvers: {}
					}
				}
			}
		}
	}

	configData: ConfigData = merge({}, Settings.defaultConfig)

	cacheData: CacheData = merge({}, Settings.defaultCache)

	constructor(state: MetaDeckState)
	{
		this.state = state;
		this.logger = new Logger("Settings");
	}


	get config(): ConfigData
	{
		const self: Settings = this;
		const createHandler = <T>(path: string[] = []) => ({
			get: (target: T, key: keyof T): any => {
				if (key == 'isProxy') return true;
				if (typeof target[key] === 'object' && target[key] != null)
					return new Proxy(
						   target[key],
						   createHandler<any>([...path, key as string])
					);
				return target[key];
			},
			set: (target: T, key: keyof T, value: any) =>  {
				self.logger.debug(`Setting ${[...path, key]} to: `, value);
				target[key] = value;
				void self.writeConfig();
				self.state.notifyUpdate();
				return true;
			}
		});

		return new Proxy(this.configData, createHandler<ConfigData>());
	}

	get cache(): CacheData
	{
		const self: Settings = this

		const createHandler = <T>(path: string[] = []) => ({
			get: (target: T, key: keyof T): any => {
				if (key == 'isProxy') return true;
				if (typeof target[key] === 'object' && target[key] != null)
					return new Proxy(
						   target[key],
						   createHandler<any>([...path, key as string])
					);
				return target[key];
			},
			set: (target: T, key: keyof T, value: any) =>  {
				self.logger.debug(`Setting ${[...path, key]} to: `, value);
				target[key] = value;
				void self.writeCache();
				self.state.notifyUpdate();
				return true;
			}
		});

		return new Proxy(self.cacheData, createHandler<CacheData>());
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
		this.configData = merge({}, Settings.defaultConfig, await this.read_config() ?? {});
		const end = systemClock.getTimeMs();
		this.logger.debug("Read config in " + (end - start) + "ms", this.configData);
	}

	async writeConfig(): Promise<void>
	{
		this.logger.debug("Writing config...");
		const start = systemClock.getTimeMs();
		await this.write_config(this.configData);
		const end = systemClock.getTimeMs();
		this.logger.debug("Wrote settings in " + (end - start) + "ms", this.configData);
	}

	async readCache(): Promise<void>
	{
		this.logger.debug("Reading cache...");
		const start = systemClock.getTimeMs();
		this.cacheData = merge({}, Settings.defaultCache, await this.read_cache() ?? {});
		const end = systemClock.getTimeMs();
		this.logger.debug("Read cache in " + (end - start) + "ms", this.cacheData);
	}

	async writeCache(): Promise<void>
	{
		this.logger.debug("Writing cache...");
		const start = systemClock.getTimeMs();
		await this.write_cache(this.cacheData);
		const end = systemClock.getTimeMs();
		this.logger.debug("Wrote cache in " + (end - start) + "ms", this.cacheData);
	}
}