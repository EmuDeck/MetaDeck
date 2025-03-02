import {AsyncMountable} from "../System";
import {MetaDeckState} from "../MetaDeckState";
import {Module, ModuleCache, ModuleConfig} from "./Module";
import {FC} from "react";
import throttledQueue from "throttled-queue";
import {Resolver, ResolverCache, ResolverConfig} from "./Resolver";
import {ID} from "../Interfaces";

export interface ProviderConfig<ResConfigs extends Record<keyof ResConfigs, ResConfig>, ResConfig extends ResolverConfig>
{
	enabled: boolean,
	ordinal: number,
	resolvers: ResConfigs
}

export interface ProviderCache<ResCaches extends Record<keyof ResCaches, ResCache>, ResCache extends ResolverCache>
{
	resolvers: ResCaches
}

export abstract class Provider<
	   Mod extends Module<Mod, Prov, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   Prov extends Provider<Mod, Prov, Res, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   Res extends Resolver<Mod, Prov, Res, ModConfig, ProvConfigs, ProvConfig, ProvResConfigs, ModCache, ProvCaches, ProvCache, ProvResCaches, Data>,
	   ModConfig extends ModuleConfig<ProvConfigs, ProvConfig>,
	   ProvConfigs extends Record<keyof ProvConfigs, ProvConfig>,
	   ProvConfig extends ProviderConfig<ProvResConfigs[keyof ProvResConfigs], ResolverConfig & ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]]>,
	   ProvResConfigs extends Record<keyof ProvResConfigs, Record<keyof ProvResConfigs[keyof ProvResConfigs], ProvResConfigs[keyof ProvResConfigs][keyof ProvResConfigs[keyof ProvResConfigs]]>>,
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

	get config(): ProvConfig
	{
		return this.module.config.providers[this.identifier as keyof ProvConfigs];
	}

	get cache(): ProvCache
	{
		return this.module.cache.providers[this.identifier as keyof ProvCaches];
	}

	abstract identifier: string
	abstract title: string

	abstract resolvers: Res[]

	protected throttle = throttledQueue(4, 1000, true);

	constructor(module: Mod)
	{
		this._state = module.state;
		this._module = module;
	}

	protected handleError(error: Error): never
	{
		this.state.loadingData.currentModule.error = error
		throw error
	}

	async mount(): Promise<void>
	{
		try
		{
			this.resolvers.sort((a, b) => a.config.ordinal - b.config.ordinal)
			if (this.enabled)
			{
				for (const resolver of this.resolvers)
				{
					if (resolver.enabled)
						await resolver.mount();
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
			if (this.enabled)
			{
				for (const resolver of this.resolvers)
				{
					await resolver.dismount();
				}
			}
		} catch (e: any)
		{
			this.handleError(e);
		}
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

	async resolve(appId: number): Promise<ID | undefined>
	{
		for (const resolver of this.resolvers.filter((provider) => provider.enabled))
		{
			if (resolver.enabled && await resolver.test(appId))
			{
				return await resolver.resolve(appId);
			}
		}
		return;
	}

	async apply(appId: number, data: Data): Promise<void>
	{
		for (const resolver of this.resolvers.filter((resolver) => resolver.enabled))
		{
			if (resolver.enabled && await resolver.test(appId))
			{
				await resolver.apply(appId, data);
				return;
			}
		}
	}

	abstract test(appId: number): Promise<boolean>;

	abstract provide(appId: number): Promise<Data | undefined>;

	abstract settingsComponent(): FC
}