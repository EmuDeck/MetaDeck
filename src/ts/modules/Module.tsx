import {Provider, ProviderCache, ProviderConfig} from "./Provider";
import {MetadataCache, MetadataConfig} from "./metadata/MetadataModule";
import {AsyncMountable, Mounts} from "../System";
import {MetaDeckState, Modules} from "../MetaDeckState";
import {FC} from "react";
import Logger from "../logger";
import {CompatdataCache, CompatdataConfig} from "./compatdata/CompatdataModule";
import {SteamAppDetails, SteamAppOverview} from "../SteamTypes";
import {getAppDetails, stateTransaction} from "../util";
import {format, t} from "../useTranslations";
import PromisePool from "es6-promise-pool";
import {ResolverCache, ResolverConfig} from "./Resolver";

export interface ModuleConfig<ProvConfigs extends Record<keyof ProvConfigs, ProvConfig>, ProvConfig extends ProviderConfig<any, any>>
{
	enabled: boolean,
	providers: ProvConfigs
}

export interface ModuleCache<ProvCaches extends Record<keyof ProvCaches, ProvCache>, ProvCache extends ProviderCache<any, any>, Data>
{
	data: Record<number, Data>,
	providers: ProvCaches
}

export interface ModuleConfigs
{
	metadata: MetadataConfig,
	compatdata: CompatdataConfig
}

export interface ModuleCaches
{
	metadata: MetadataCache,
	compatdata: CompatdataCache
}


export abstract class Module<
	   Mod extends Module<Mod, Prov, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   Prov extends Provider<Mod, Prov, any, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   ModConfig extends ModuleConfig<ProvConfigs, ProvConfig>,
	   ProvConfigs extends Record<keyof ProvConfigs, ProvConfig>,
	   ProvConfig extends ProviderConfig<ProvResConfigs[keyof ProvResConfigs], ResolverConfig & ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]]>,
	   ProvResConfigs extends Record<keyof ProvResConfigs, Record<keyof ProvResConfigs[keyof ProvResConfigs], ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]]>>,
	   ModCache extends ModuleCache<ProvCaches, ProvCache, Data>,
	   ProvCaches extends Record<keyof ProvCaches, ProvCache>,
	   ProvCache extends ProviderCache<ProvResCaches[keyof ProvResCaches], ResolverCache & ProvResCaches[keyof ProvResCaches][keyof ProvResCaches[keyof ProvResCaches]]>,
	   ProvResCaches extends Record<keyof ProvResCaches, Record<keyof ProvResCaches[keyof ProvResCaches], ProvResCaches[keyof ProvResCaches][keyof ProvResCaches[keyof ProvResCaches]]>>,
	   Data
> implements AsyncMountable
{

	state: MetaDeckState;

	abstract identifier: string;
	abstract title: string;

	abstract logger: Logger;

	abstract providers: Prov[];

	abstract config: ModConfig;
	abstract cache: ModCache;

	dependencies: (keyof Modules)[] = []

	private _unmetDependency: boolean = false

	constructor(state: MetaDeckState)
	{
		state.mounts.addMount(this);
		this.addMounts(state.mounts);
		this.state = state;
	}

	protected handleError(error: Error): never
	{
		this.state.loadingData.currentModule.error = error
		throw error
	}

	get data(): Record<number, Data>
	{
		return this.cache.data;
	}

	set data(data: Record<number, Data>)
	{
		this.cache.data = data;
		void this.saveData();
	}

	get enabled(): boolean
	{
		return this.config.enabled;
	}

	set enabled(enabled: boolean)
	{
		this.config.enabled = enabled;
		void this.saveData();
	}

	get unmetDependency(): boolean
	{
		return this._unmetDependency;
	}

	set unmetDependency(value: boolean)
	{
		this._unmetDependency = value;
	}

	get isValid(): boolean
	{
		return !this.unmetDependency && this.enabled;
	}

	async apply(appId: number): Promise<void>
	{
		try
		{
			const overview = appStore.GetAppOverviewByAppID(appId)
			if (overview.app_type == 1073741824)
			{
				await this.applyOverview(overview);
				await stateTransaction(async () => {
					const details = await getAppDetails(appId);
					if (details)
						await this.applyDetails(details);
				})
			}
		} catch (e: any)
		{
			this.handleError(e);
		}

	}

	async applyApp(overview: SteamAppOverview, details: SteamAppDetails)
	{
		try
		{
			if (overview.app_type == 1073741824)
			{
				await this.applyOverview(overview);
				await stateTransaction(async () => {
					await this.applyDetails(details)
				})
			}
		} catch (e: any)
		{
			this.handleError(e);
		}

	}

	async applyOverview(_overview: SteamAppOverview): Promise<void>
	{
	}

	async applyDetails(_details: SteamAppDetails): Promise<void>
	{
	}

	async removeCache(appId: number): Promise<void>
	{
		delete this.data[appId];
		await this.saveData();
	}

	async clearCache(): Promise<void>
	{
		for (let appId of Object.keys(this.data))
		{
			await this.removeCache(+appId);
		}
		this.data = {};
		await this.saveData();
	}

	async loadData(): Promise<void>
	{
		await this.state.settings.readSettings();
	}

	async saveData(): Promise<void>
	{
		await this.state.settings.writeSettings();
	}

	abstract addMounts(mounts: Mounts): void;

	abstract progressDescription(data?: Data): string

	get missingDescription(): string
	{
		return format(t("noData"), this.title)
	}

	public hasData(appId: number): boolean
	{
		return !!this.data[appId];
	}

	public fetchData(appId: number): Data | undefined
	{
		try
		{
			this.logger.debug(`Fetching ${this.identifier} for ${appId}`, this.data[appId], this.data)
			if (!this.data[appId])
				void this.fetchDataAsync(appId);
			return this.data[appId];
		} catch (e: any)
		{
			this.handleError(e);
		}
	}

	public async fetchDataAsync(appId: number): Promise<Data | undefined>
	{
		try
		{
			if (!this.hasData(appId))
			{
				let data = await this.provide(appId);
				if (!!data)
				{
					this.logger.debug(`Caching ${this.identifier} for ${appId}: `, data);
					this.data[appId] = data;
				}
			} else
			{
				this.logger.debug(`Loading cached ${this.identifier} for ${appId}: `, this.data[appId]);
			}

			void this.apply(appId);

			return this.data[appId];
		} catch (e: any)
		{
			this.handleError(e);
		}
	}

	async refresh(): Promise<void>
	{
		try
		{
			await this.refreshDataForApps(this.state.apps)
			this.logger.debug(`Refreshed ${this.identifier}`, this.data);
		} catch (e: any)
		{
			this.handleError(e);
		}

	}

	private async refreshDataForApps(appIds: number[]): Promise<void>
	{
		let self = this

		//@ts-ignore
		await new PromisePool(function* () {
			for (let appId of appIds)
			{
				yield self.refreshDataForApp(appId)
			}
		}, 4).start()
		// for (let appId of appIds)
		// {
		// 	await this.refreshDataForApp(appId)
		// }
	}

	private async refreshDataForApp(appId: number): Promise<void>
	{
		const overview = appStore.GetAppOverviewByAppID(appId);
		const data = await this.fetchDataAsync(appId)
		this.logger.debug(`Refreshed ${this.identifier} for ${appId}: `, data);
		if (overview && data)
		{
			this.state.loadingData.currentModule.game = overview.display_name;
			this.state.loadingData.currentModule.description = !!data ? this.progressDescription(data) : this.missingDescription;
			this.state.loadingData.currentModule.processed++;
		} else
		{
			this.state.loadingData.currentModule.game = overview.display_name;
			this.state.loadingData.currentModule.description = this.missingDescription;
			this.state.loadingData.currentModule.processed++;
		}
	}


	abstract settingsComponent(): FC

	async mount(): Promise<void>
	{
		try
		{
			this.providers.sort((a, b) =>
				   this.config.providers[a.identifier as keyof ProvConfigs].ordinal - this.config.providers[b.identifier as keyof ProvConfigs].ordinal
			)
			if (this.enabled)
			{
				for (const provider of this.providers)
				{
					if (provider.enabled)
						await provider.mount();
				}
			}
		} catch (e: any)
		{
			this.handleError(e);
		}
	}

	async dismount(): Promise<void>
	{
		try
		{
			for (const provider of this.providers)
			{
				await provider.dismount();
			}
		} catch (e: any)
		{
			this.handleError(e);
		}

	}

	async provide(appId: number): Promise<Data | undefined>
	{
		for (const provider of this.providers.filter((provider) => provider.enabled))
		{
			if (provider.enabled && await provider.test(appId))
			{
				const data = await provider.provide(appId);
				if (data)
					await this.provideAdditional(appId, data);
				return data;
			}
		}
		return this.provideDefault(appId);
	}

	async provideDefault(_appId: number): Promise<Data | undefined>
	{
		return undefined
	}

	async provideAdditional(appId: number, data: Data): Promise<void>
	{
		for (const provider of this.providers.filter((provider) => provider.enabled))
		{
			if (provider.enabled && await provider.test(appId))
			{
				await provider.apply(appId, data);
				return;
			}
		}
	}
}