import {Resolver} from "../Resolver";
import {
	MetadataCache,
	MetadataConfig,
	MetadataModule, MetadataProviderCaches, MetadataProviderCacheTypes,
	MetadataProviderConfigs,
	MetadataProviderConfigTypes, MetadataProviderResolverCaches, MetadataProviderResolverConfigs
} from "./MetadataModule";
import {MetadataProvider} from "./MetadataProvider";
import {MetadataData} from "../../Interfaces";

export abstract class MetadataProviderResolver<Res extends Resolver<
	   MetadataModule,
	   MetadataProvider<Res>,
	   Res,
	   MetadataConfig,
	   MetadataProviderConfigs,
	   MetadataProviderConfigTypes,
	   MetadataProviderResolverConfigs,
	   MetadataCache,
	   MetadataProviderCaches,
	   MetadataProviderCacheTypes,
	   MetadataProviderResolverCaches,
	   MetadataData
>> extends Resolver<
	   MetadataModule,
	   MetadataProvider<Res>,
	   Res,
	   MetadataConfig,
	   MetadataProviderConfigs,
	   MetadataProviderConfigTypes,
	   MetadataProviderResolverConfigs,
	   MetadataCache,
	   MetadataProviderCaches,
	   MetadataProviderCacheTypes,
	   MetadataProviderResolverCaches,
	   MetadataData
>
{

}