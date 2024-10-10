import {Provider} from "../provider";
import {CompatdataData} from "../../Interfaces";
import {
	CompatdataCache,
	CompatdataConfig,
	CompatdataModule, CompatdataProviderCaches, CompatdataProviderCacheTypes,
	CompatdataProviderConfigs,
	CompatdataProviderConfigTypes
} from "./CompatdataModule";

export abstract class CompatdataProvider extends Provider<CompatdataProvider, CompatdataModule, CompatdataConfig, CompatdataProviderConfigs, CompatdataProviderConfigTypes, CompatdataCache, CompatdataProviderCaches, CompatdataProviderCacheTypes, CompatdataData>
{
	protected module: CompatdataModule;
	constructor(module: CompatdataModule)
	{
		super(module);
		this.module = module;
	}
}