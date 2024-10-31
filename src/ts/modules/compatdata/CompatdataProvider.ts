import {Provider} from "../Provider";
import {CompatdataData} from "../../Interfaces";
import {
	CompatdataCache,
	CompatdataConfig,
	CompatdataModule, CompatdataProviderCaches, CompatdataProviderCacheTypes,
	CompatdataProviderConfigs,
	CompatdataProviderConfigTypes, CompatdataProviderResolverCaches, CompatdataProviderResolverConfigs
} from "./CompatdataModule";
import {Resolver} from "../Resolver";

export abstract class CompatdataProvider<Res extends Resolver<
	   CompatdataModule,
	   CompatdataProvider<Res>,
	   Res,
	   CompatdataConfig,
	   CompatdataProviderConfigs,
	   CompatdataProviderConfigTypes,
	   CompatdataProviderResolverConfigs,
	   CompatdataCache,
	   CompatdataProviderCaches,
	   CompatdataProviderCacheTypes,
	   CompatdataProviderResolverCaches,
	   CompatdataData
>> extends Provider<
	   CompatdataModule,
	   CompatdataProvider<Res>,
	   Res,
	   CompatdataConfig,
	   CompatdataProviderConfigs,
	   CompatdataProviderConfigTypes,
	   CompatdataProviderResolverConfigs,
	   CompatdataCache,
	   CompatdataProviderCaches,
	   CompatdataProviderCacheTypes,
	   CompatdataProviderResolverCaches,
	   CompatdataData
>
{
}