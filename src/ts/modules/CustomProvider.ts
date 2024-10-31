import {Provider, ProviderCache, ProviderConfig} from "./Provider";
import {Module, ModuleCache, ModuleConfig} from "./Module";
import {Resolver, ResolverCache, ResolverConfig} from "./Resolver";

export abstract class CustomProvider<
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
> extends Provider<
	   Mod,
	   Prov,
	   Res,
	   ModConfig,
	   ProvConfigs,
	   ProvConfig,
	   ProvResConfigs,
	   ModCache,
	   ProvCaches,
	   ProvCache,
	   ProvResCaches,
	   Data
>
{

}