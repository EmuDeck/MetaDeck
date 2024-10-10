import {Provider} from "../provider";
import {MetadataData} from "../../Interfaces";
import {
	MetadataCache,
	MetadataConfig,
	MetadataModule,
	MetadataProviderCaches, MetadataProviderCacheTypes,
	MetadataProviderConfigs,
	MetadataProviderConfigTypes
} from "./MetadataModule";

export abstract class MetadataProvider extends Provider<MetadataProvider, MetadataModule,  MetadataConfig, MetadataProviderConfigs, MetadataProviderConfigTypes, MetadataCache, MetadataProviderCaches, MetadataProviderCacheTypes, MetadataData>
{
	protected module: MetadataModule;
	constructor(module: MetadataModule)
	{
		super(module);
		this.module = module;
	}
}