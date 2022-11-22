import {AppAchievements, AppDetails, AppOverview, Hook} from "./SteamClient";
import { ObservableMap } from "mobx";

export interface AppStore
{
	m_mapApps: ObservableMap<number, AppDetails>;
	UpdateAppOverview: any,
	GetAppOverviewByAppID: (id: number) => AppOverview,
	GetAppOverviewByGameID: (id: string) => AppOverview,
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
	GetAppDetails: (id: number) => AppDetails,
	RegisterForAppData: (app_id: any, callback: (data: AppDetails) => void) => Hook

	GetAchievements(app_id: number): AppAchievements;
}