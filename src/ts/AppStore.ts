import { ObservableMap } from "mobx";
import {AppData, Hook, SteamAppAchievements, SteamAppDetails, SteamAppOverview} from "./SteamTypes";

export interface AppStore
{
	m_mapApps: ObservableMap<number, SteamAppOverview>;
	UpdateAppOverview: any,
	GetAppOverviewByAppID: (id: number) => SteamAppOverview,
	GetAppOverviewByGameID: (id: string) => SteamAppOverview,
	CompareSortAs: any,
	allApps: any,
	storeTagCounts: any,
	GetTopStoreTags: any,
	OnLocalizationChanged: any,
	GetStoreTagLocalization: any,
	GetLocalizationForStoreTag: any,
	AsyncGetLocalizationForStoreTag: any,
	sharedLibraryAccountIds: any,
	siteLicenseApps: any,
	GetIconURLForApp: any,
	GetLandscapeImageURLForApp: any,
	GetCachedLandscapeImageURLForApp: any,
	GetVerticalCapsuleURLForApp: any,
	GetPregeneratedVerticalCapsuleForApp: any
	GetCachedVerticalCapsuleURL: any,
	GetCustomImageURLs: any,
	GetCustomVerticalCapsuleURLs: any,
	GetCustomLandcapeImageURLs: any,
	GetCustomHeroImageURLs: any,
	GetCustomLogoImageURLs: any,
	GetStorePageURLForApp: any
}

export interface AppDetailsStore {
	__proto__: any;
	GetAppDetails(id: number): SteamAppDetails,
	RegisterForAppData(app_id: any, callback: (data: SteamAppDetails) => void): Hook
	GetAchievements(app_id: number): SteamAppAchievements;
	GetAppData(app_id: number): AppData;
}