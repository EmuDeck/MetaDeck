import {createContext, FC, PropsWithChildren, useContext, useEffect, useState} from "react";
import {Settings} from "./settings";
import {t} from "./useTranslations";
import {MetadataModule} from "./modules/metadata/MetadataModule";
import {AsyncMountable, Mounts, systemClock} from "./System";
import {Module} from "./modules/Module";
import {getAllNonSteamAppOverviews} from "./util";
import {Provider} from "./modules/Provider";
import {CompatdataModule} from "./modules/compatdata/CompatdataModule";
import {toaster} from "@decky/api";
import {EventBus} from "./events";
import {SteamAppOverview} from "./SteamTypes";

interface GlobalLoadingData
{
	get currentModule(): ModuleLoadingData

	get module(): keyof Modules | ""

	set module(value: keyof Modules | "")

	get percentage(): number

	get total(): number

	set total(value: number)

	get processed(): number

	set processed(value: number)

	get loading(): boolean

	set loading(value: boolean)

	get modules(): Record<keyof Modules | "", ModuleLoadingData>
}

interface ModuleLoadingData
{
	get module(): Modules[keyof Modules]

	get game(): string

	set game(value: string)

	get description(): string

	set description(value: string)

	get percentage(): number

	get total(): number

	set total(value: number)

	get processed(): number

	set processed(value: number)

	get error(): Error | undefined

	set error(value: Error | undefined)
}

export interface Modules extends Record<string, Module<any, Provider<any, any, any, any, any, any, any, any, any, any, any, any>, any, any, any, any, any, any, any, any, any>>
{
	readonly metadata: MetadataModule,
	readonly compatdata: CompatdataModule
}

export interface MetaDeckStateContext
{
	readonly loadingData: GlobalLoadingData,
	readonly modules: Modules,
	readonly overviews: SteamAppOverview[],
	readonly apps: number[],
	readonly settings: Settings,
	readonly mounts: Mounts,
	readonly eventBus: EventBus,

	clear(): Promise<void>,

	refresh(): Promise<void>,
}

class GlobalLoadingDataImpl implements GlobalLoadingData
{
	private readonly state: MetaDeckState;

	constructor(outer: MetaDeckState)
	{
		this.state = outer;

	}

	get currentModule(): ModuleLoadingData
	{
		return this.modules[this.module]
	}

	private _module: keyof Modules | "" = ""
	
	get module(): keyof Modules | ""
	{
		return this._module;
	}

	set module(value: keyof Modules | "")
	{
		this._module = value;
		this.state.notifyUpdate();
	}

	get percentage(): number
	{
		return (this.processed / this.total) * 100;
	}

	private _total: number = 0;

	get total(): number
	{
		return this._total;
	}

	set total(value: number)
	{
		this._total = value;
		this.state.notifyUpdate();
	}

	private _processed: number = 0;

	get processed(): number
	{
		return this._processed;
	}

	set processed(value: number)
	{
		this._processed = value;
		this.state.notifyUpdate();
	}

	private _loading = false;

	get loading(): boolean
	{
		return this._loading;
	}

	set loading(value: boolean)
	{
		this._loading = value;
		this.state.notifyUpdate();
	}

	private readonly _modules: Record<keyof Modules | "", ModuleLoadingData> = {}

	get modules(): Record<keyof Modules | "", ModuleLoadingData>
	{
		return this._modules;
	}

}

class ModuleLoadingDataImpl implements ModuleLoadingData
{
	private readonly state: MetaDeckState;

	constructor(outer: MetaDeckState, identifier: keyof Modules)
	{
		this.state = outer;
		this._module = this.state.modules[identifier];
	}

	private readonly _module: Modules[keyof Modules]

	get module(): Modules[keyof Modules]
	{
		return this._module;
	}

	private _game = t("loading");
	
	get game(): string
	{
		return this._game;
	}

	set game(value: string)
	{
		this._game = value;
		this.state.notifyUpdate();
	}

	private _description = "";
	
	get description(): string
	{
		return this._description;
	}

	set description(value: string)
	{
		this._description = value;
		this.state.notifyUpdate();
	}

	get percentage(): number
	{
		return (this.processed / this.total) * 100;
	}

	private _total = 0;
	
	get total(): number
	{
		return this._total;
	}

	set total(value: number)
	{
		this._total = value;
		this.state.notifyUpdate();
	}

	private _processed = 0;
	
	get processed(): number
	{
		return this._processed;
	}

	set processed(value: number)
	{
		this._processed = value;
		this.state.notifyUpdate();
	}

	private _error: Error | undefined;
	
	get error(): Error | undefined
	{
		return this._error;
	}

	set error(value: Error | undefined)
	{
		this._error = value;
		this.state.notifyUpdate();
	}
}


export class MetaDeckState implements AsyncMountable
{
	private readonly _loadingData: GlobalLoadingData = new GlobalLoadingDataImpl(this)

	private readonly _settings: Settings;
	private readonly _mounts: Mounts;
	private readonly _modules: Modules;
	private readonly _eventBus: EventBus

	constructor(eventBus: EventBus, mounts: Mounts)
	{
		const self = this;
		this._settings = new Settings(this);
		this._eventBus = eventBus;
		this._mounts = mounts;
		this.mounts.addMount({
			mount()
			{
				window.MetaDeck = self.state;
			},
			dismount()
			{
				delete window.MetaDeck;
			}
		});
		this._modules = {
			metadata: new MetadataModule(this),
			compatdata: new CompatdataModule(this)
		};
		this.mounts.addMount(this);
	}


	get state(): MetaDeckStateContext
	{
		return {
			loadingData: this.loadingData,
			modules: this.modules,
			overviews: this.overviews,
			apps: this.apps,
			// serverAPI: this.serverAPI,
			settings: this.settings,
			mounts: this.mounts,
			eventBus: this.eventBus,
			clear: () => this.clear(),
			refresh: () => this.refresh(),
		};
	}

	get modules(): Modules
	{
		return this._modules;
	}

	get loadingData(): GlobalLoadingData
	{
		return this._loadingData;
	}

	get overviews(): SteamAppOverview[]
	{
		return getAllNonSteamAppOverviews().sort((a, b) => {

			if (a.sort_as < b.sort_as)
			{
				return -1;
			}
			if (a.sort_as > b.sort_as)
			{
				return 1;
			}
			return 0;
		})
	}

	get apps(): number[]
	{
		return this.overviews.map(overview => overview.appid);
	}

	get settings(): Settings
	{
		return this._settings;
	}

	get mounts(): Mounts
	{
		return this._mounts;
	}

	get eventBus(): EventBus
	{
		return this._eventBus;
	}

	async mount(): Promise<void>
	{
		await this.refresh();
	}

	async dismount(): Promise<void>
	{
		await this.settings.writeSettings();
	}

	async refresh(): Promise<void>
	{
		await this.settings.readSettings();
		for (let key of Object.keys(this.state.modules))
		{
			this.loadingData.modules[key] = new ModuleLoadingDataImpl(this, this.modules[key].identifier);
		}
		this.loadingData.loading = true;
		this.loadingData.total = Object.values(this.modules).filter((mod) => mod.isValid).length;
		this.loadingData.processed = 0;
		for (let module of Object.values(this.modules).filter((mod) => mod.isValid))
		{
			this.loadingData.module = module.identifier;
			this.loadingData.currentModule.total = this.apps.length;
			this.loadingData.currentModule.processed = 0;
			await module.refresh();
			this.loadingData.currentModule.game = t("initializing");
			this.loadingData.currentModule.description = "";
			this.loadingData.currentModule.total = 0;
			this.loadingData.currentModule.processed = 0;
			this.loadingData.processed++;
			this.notifyUpdate();
		}
		this.loadingData.loading = false;
		this.loadingData.total = 0;
		this.loadingData.processed = 0;
		this.notifyUpdate();
		await this.settings.writeSettings();
	}

	async clear(): Promise<void>
	{
		for (let module of Object.values(this.modules))
		{
			await module.clearCache();
		}
		toaster.toast({
			title: t("title"),
			body: t("cacheCleared")
		});
		this.notifyUpdate();
	}

	notifyUpdate(): void
	{
		void this.eventBus.emit("Update", { createdAt: systemClock.getTimeMs() });
	}
}

export const MetaDeckStateContext = createContext<MetaDeckStateContext>(null as any);

export const useMetaDeckState = () => useContext(MetaDeckStateContext);

interface Props extends PropsWithChildren
{
	metaDeckState: MetaDeckState;
}

export const MetaDeckStateContextProvider: FC<Props> = ({children, metaDeckState}) => {
	const [publicMetaDeckState, setPublicMetaDeckState] = useState<MetaDeckStateContext>({...metaDeckState.state});

	useEffect(() => {
		function onUpdate()
		{
			setPublicMetaDeckState({...metaDeckState.state});
		}

		const unsubscribe = metaDeckState.eventBus.on("Update", onUpdate);

		return () => unsubscribe();
	}, []);


	return (
		   <MetaDeckStateContext.Provider
				 value={{...publicMetaDeckState}}
		   >
			   {children}
		   </MetaDeckStateContext.Provider>
	);
};