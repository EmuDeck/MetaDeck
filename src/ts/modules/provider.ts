import {AsyncMountable} from "../System";
import {MetaDeckState} from "../hooks/metadataContext";
import {Module, ModuleCache, ModuleConfig} from "./module";
import {FC} from "react";
import throttledQueue from "throttled-queue";

export interface ProviderConfig
{
	enabled: boolean,
	ordinal: number
}

export interface ProviderCache
{
}

export abstract class Provider<Prov extends Provider<Prov, Mod, ModConfig, ProvConfigs, ProvConfig, ModCache, ProvCaches, ProvCache, Data>, Mod extends Module<Mod, Prov, ModConfig, ProvConfigs, ProvConfig, ModCache, ProvCaches, ProvCache, Data>, ModConfig extends ModuleConfig<ModConfig, Mod, Prov, ProvConfigs, ProvConfig, Data>, ProvConfigs extends Record<keyof ProvConfigs, ProvConfig>, ProvConfig extends ProviderConfig, ModCache extends ModuleCache<ModCache, Mod, Prov, ProvCaches, ProvCache, Data>, ProvCaches extends Record<keyof ProvCaches, ProvCache>, ProvCache extends ProviderCache, Data> implements AsyncMountable
{
	protected state: MetaDeckState;
	protected module: Mod;
	abstract identifier: string
	abstract title: string

	protected throttle = throttledQueue(4, 1000, true);

	protected constructor(module: Mod)
	{
		this.state = module.state;
		this.module = module;
	}

	async mount(): Promise<void>
	{

	}

	async dismount(): Promise<void>
	{

	}

	get enabled(): boolean
	{
		return this.module.config.providers[this.identifier as keyof ProvConfigs].enabled
	}

	set enabled(enabled: boolean)
	{
		this.module.config.providers[this.identifier as keyof ProvConfigs].enabled = enabled
		void this.module.saveData();
	}

	abstract test(appId: number): Promise<boolean>;

	abstract provide(appId: number): Promise<Data | undefined>;

	abstract settingsComponent(): FC
}