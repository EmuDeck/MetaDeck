import {Module, ModuleCache, ModuleConfig} from "./Module";
import {AsyncMountable} from "../System";
import {Provider, ProviderCache, ProviderConfig} from "./Provider";
import {MetaDeckState} from "../MetaDeckState";
import {ID} from "../Interfaces";

export interface ResolverConfig
{
	enabled: boolean,
	ordinal: number
}

export interface ResolverCache
{
}

export abstract class Resolver<
	   Mod extends Module<Mod, Prov, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   Prov extends Provider<Mod, Prov, Res, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   Res extends Resolver<Mod, Prov, Res, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   ModConfig extends ModuleConfig<ProvConfigs, ProvConfig>,
	   ProvConfigs extends Record<keyof ProvConfigs, ProvConfig>,
	   ProvConfig extends ProviderConfig<ProvResConfigs[keyof ProvResConfigs], ResolverConfig & ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]]>,
	   ProvResConfigs extends Record<keyof ProvResConfigs, Record<keyof ProvResConfigs[keyof ProvResConfigs], ResolverConfig & (ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]])>>,
	   ModCache extends ModuleCache<ProvCaches, ProvCache, Data>,
	   ProvCaches extends Record<keyof ProvCaches, ProvCache>,
	   ProvCache extends ProviderCache<ProvResCaches[keyof ProvResCaches], ResolverCache & ProvResCaches[keyof ProvResCaches][keyof ProvResCaches[keyof ProvResCaches]]>,
	   ProvResCaches extends Record<keyof ProvResCaches, Record<keyof ProvResCaches[keyof ProvResCaches], ResolverCache & (ProvResCaches[keyof ProvResCaches][keyof ProvResCaches[keyof ProvResCaches]])>>,
	   Data
> implements AsyncMountable
{
	private readonly _state: MetaDeckState;
	get state(): MetaDeckState
	{
		return this._state;
	}

	private readonly _module: Mod;
	get module(): Mod
	{
		return this._module;
	}

	private readonly _provider: Prov;
	get provider(): Prov
	{
		return this._provider;
	}

	get config(): ResolverConfig & ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]]
	{
		return (this.provider.config.resolvers[this.identifier as keyof ProvResConfigs[keyof ProvResConfigs]]) as ResolverConfig & ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]]
	}

	get cache(): ResolverCache & ProvResCaches[keyof ProvResCaches][keyof ProvResCaches[keyof ProvResCaches]]
	{
		return (this.provider.cache.resolvers[this.identifier as keyof ProvResCaches[keyof ProvResCaches]]) as ResolverCache & ProvResCaches[keyof ProvResCaches][keyof ProvResCaches[keyof ProvResCaches]]
	}

	abstract identifier: string;
	abstract title: string;

	constructor(provider: Prov)
	{
		this._state = provider.state;
		this._module = provider.module;
		this._provider = provider;
	}

	async mount(): Promise<void>
	{
	}

	async dismount(): Promise<void>
	{
	}

	get enabled(): boolean
	{
		return this.config.enabled
	}

	set enabled(enabled: boolean)
	{
		this.config.enabled = enabled
		void this.module.saveData();
	}

	abstract test(appId: number): Promise<boolean>

	abstract resolve(appId: number): Promise<ID | undefined>

	async apply(_appId: number, _data: Data): Promise<void> {}
}