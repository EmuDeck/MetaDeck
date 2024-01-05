import {ServerAPI} from "decky-frontend-lib";
import {createContext, FC, ReactNode, useContext, useEffect, useState} from "react";
import {getAllNonSteamAppOverviews, MetadataManager} from "../MetadataManager";
import {Settings} from "../settings";
import {t} from "../useTranslations";

interface LoadingData
{
	get percentage(): number
	get globalLoading(): boolean
	set globalLoading(value: boolean)
	get game(): string
	set game(value: string)
	get description(): string
	set description(value: string)
	get processed(): number
	set processed(value: number)
	get total(): number
	set total(value: number)
	get fetching(): boolean
	set fetching(value: boolean)
}

interface Managers
{
	metadataManager: MetadataManager
}

interface MetaDeckStateContext
{
	loadingData: LoadingData,
	managers: Managers,
	apps: Promise<number[]>,
	serverAPI: ServerAPI,
	settings: Settings,
	refresh(): Promise<void>,
}


export class MetaDeckState
{
	private _loadingData: LoadingData = new class implements LoadingData
	{
		private state: MetaDeckState;

		constructor(outer: MetaDeckState)
		{
			this.state = outer;
		}

		get percentage(): number
		{
			return (this.processed / this.total) * 100;
		}

		private _globalLoading = false;

		get globalLoading(): boolean
		{
			return this._globalLoading;
		}

		set globalLoading(value: boolean)
		{
			this._globalLoading = value;
			this.state.notifyUpdate();
		}

		private _total =  0;
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

		private _game = t("fetching");
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

		private _fetching =  true;
		get fetching(): boolean
		{
			return this._fetching;
		}

		set fetching(value: boolean)
		{
			this._fetching = value;
			this.state.notifyUpdate();
		}
	}(this);

	private readonly _serverAPI;
	private readonly _settings;

	constructor(serverAPI: ServerAPI)
	{
		this._serverAPI = serverAPI;
		this._settings = new Settings(this);
	}

	private readonly _managers: Managers = {
		metadataManager: new MetadataManager(this)
	}

	public eventBus = new EventTarget();

	get state(): MetaDeckStateContext
	{
		return {
			loadingData: this.loadingData,
			managers: this.managers,
			apps: this.apps,
			serverAPI: this.serverAPI,
			settings: this.settings,
			refresh: () => this.refresh(),
		};
	}

	get managers(): Managers
	{
		return this._managers;
	}

	get loadingData(): LoadingData
	{
		return this._loadingData;
	}

	get apps(): Promise<number[]>
	{
		return (async () => (await getAllNonSteamAppOverviews()).filter((overview) => this._managers.metadataManager.isReady(overview.appid)).sort( (a, b) => {

			if (a.display_name < b.display_name) {
				return -1;
			}
			if (a.display_name > b.display_name) {
				return 1;
			}
			return 0;
		}).map(overview => overview.appid))();
	}

	get serverAPI(): ServerAPI
	{
		return this._serverAPI;
	}

	get settings(): Settings
	{
		return this._settings;
	}
	async init(): Promise<void>
	{
		for (let manager of Object.values(this._managers)) {
			await manager.init()
		}
		this.notifyUpdate();
	}

	async deinit(): Promise<void>
	{
		for (let manager of Object.values(this._managers)) {
			await manager.deinit()
		}
		this.notifyUpdate();
	}

	async refresh(): Promise<void>
	{
		for (let manager of Object.values(this._managers)) {
			await manager.refresh()
		}
		this.notifyUpdate();
	}

	notifyUpdate(): void
	{
		this.eventBus.dispatchEvent(new Event('update'));
	}
}

export const MetaDeckStateContext = createContext<MetaDeckStateContext>(null as any);

export const useMetaDeckState = () => useContext(MetaDeckStateContext);

interface Props
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

		metaDeckState.eventBus.addEventListener('update', onUpdate);

		return () => metaDeckState.eventBus.removeEventListener('update', onUpdate);
	}, []);


	return (
		   <MetaDeckStateContext.Provider
				 value={{...publicMetaDeckState}}
		   >
			   {children}
		   </MetaDeckStateContext.Provider>
	);
};

export const MetaDeckStateContextConsumer: FC<{children: (value: MetaDeckStateContext) => ReactNode}> = ({children}) => {
	return <MetaDeckStateContext.Consumer>
		{children}
	</MetaDeckStateContext.Consumer>
}