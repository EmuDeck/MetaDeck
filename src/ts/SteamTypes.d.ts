import React, {ReactElement, ReactNode} from "react";
import {AppDetails, AppLanguages, LogoPosition} from "decky-frontend-lib";

type Hook = {
	unregister: () => void
}

type AllAchievements =
	   {
		   loading?: boolean
		   data?: {
			   achieved: {
				   [key: string]: SteamAppAchievement
			   },
			   hidden: {
				   [key: string]: SteamAppAchievement
			   },
			   unachieved: {
				   [key: string]: SteamAppAchievement
			   },
		   }
	   }

type GlobalAchievements =
	   {
		   loading?: boolean
		   data?: {
			   [key: string]: number
		   }
	   }

type SteamAppLanguages = {
	strDisplayName: string,
	strShortName: string
}

type SteamShortcut = {
	appid: number,
	data: {
		bIsApplication: boolean,
		strAppName: string,
		strExePath: string,
		strArguments: string,
		strShortcutPath: string,
		strSortAs: string
	}
}

type LifetimeNotification = {
	unAppID: number; // seems to be 0 for shortcuts :/
	nInstanceID: number;
	bRunning: boolean;
}

type SteamAppAchievements = {
	nAchieved: number
	nTotal: number
	vecAchievedHidden: any[]
	vecHighlight: any[]
	vecUnachieved: any[]
}

type SteamAppAchievement =
{
	strID: string,
	strName: string,
	strDescription: string,
	bAchieved: boolean,
	rtUnlocked: number,
	strImage: string,
	bHidden: boolean,
	flMinProgress: number,
	flCurrentProgress: number,
	flMaxProgress: number,
	flAchieved: number
}

type SteamAppLanguages = {
	strDisplayName: string,
	strShortName: string
}

type SteamAppDetails = {
	achievements: SteamAppAchievements,
	bCanMoveInstallFolder: boolean,
	bCloudAvailable: boolean,
	bCloudEnabledForAccount: boolean,
	bCloudEnabledForApp: boolean,
	bCloudSyncOnSuspendAvailable: boolean,
	bCloudSyncOnSuspendEnabled: boolean,
	bCommunityMarketPresence: boolean,
	bEnableAllowDesktopConfiguration: boolean,
	bFreeRemovableLicense: boolean,
	bHasAllLegacyCDKeys: boolean,
	bHasAnyLocalContent: boolean,
	bHasLockedPrivateBetas: boolean,
	bIsExcludedFromSharing: boolean,
	bIsSubscribedTo: boolean,
	bOverlayEnabled: boolean,
	bOverrideInternalResolution: boolean,
	bRequiresLegacyCDKey: boolean,
	bShortcutIsVR: boolean,
	bShowCDKeyInMenus: boolean,
	bShowControllerConfig: boolean,
	bSupportsCDKeyCopyToClipboard: boolean,
	bVRGameTheatreEnabled: boolean,
	bWorkshopVisible: boolean,
	eAppOwnershipFlags: number,
	eAutoUpdateValue: number,
	eBackgroundDownloads: number,
	eCloudSync: number,
	eControllerRumblePreference: number,
	eDisplayStatus: number,
	eEnableThirdPartyControllerConfiguration: number,
	eSteamInputControllerMask: number,
	iInstallFolder: number,
	lDiskUsageBytes: number,
	lDlcUsageBytes: number,
	nBuildID: number,
	nCompatToolPriority: number,
	nPlaytimeForever: number,
	nScreenshots: number,
	rtLastTimePlayed: number,
	rtLastUpdated: number,
	rtPurchased: number,
	selectedLanguage: {
		strDisplayName: string;
		strShortName: string;
	},
	strCloudBytesAvailable: string,
	strCloudBytesUsed: string,
	strCompatToolDisplayName: string,
	strCompatToolName: string,
	strDeveloperName: string,
	strDeveloperURL: string,
	strDisplayName: string,
	strExternalSubscriptionURL: string,
	strFlatpakAppID: string,
	strHomepageURL: string,
	strLaunchOptions: string,
	strManualURL: string,
	strOwnerSteamID: string,
	strResolutionOverride: string,
	strSelectedBeta: string,
	strShortcutExe: string,
	strShortcutLaunchOptions: string,
	strShortcutStartDir: string,
	strSteamDeckBlogURL: string,
	unAppID: number,
	vecBetas: any[],
	vecDLC: any[],
	vecDeckCompatTestResults: {
		test_loc_token: string,
		test_result: number
	}[],
	vecLanguages: AppLanguages[],
	vecLegacyCDKeys: any[],
	vecMusicAlbums: any[],
	vecPlatforms: string[],
	vecScreenShots: any[],
	libraryAssets?: {
		logoPosition?: LogoPosition
	};
}

type SteamGameClientData = {
	bytes_downloaded: string,
	bytes_total: string,
	client_name: string,
	clientid: string,
	cloud_status: number,
	display_status: number,
	is_available_on_current_platform: boolean,
	status_percentage: number
}

type SteamAppOverview = {
	__proto__: SteamAppOverview,
	app_type: number,
	gameid: string,
	appid: number,
	display_name: string,
	steam_hw_compat_category_packed: number,
	readonly steam_deck_compat_category: number,
	size_on_disk: string | undefined, // can use the type of this to determine if an app is installed!
	association: { type: number, name: string }[],
	canonicalAppType: number,
	controller_support: number,
	header_filename: string | undefined,
	icon_data: string | undefined,
	icon_data_format: string | undefined,
	icon_hash: string,
	library_capsule_filename: string | undefined,
	library_id: number | string | undefined,
	local_per_client_data: SteamGameClientData,
	m_gameid: number | string | undefined,
	m_setStoreCategories: Set<number>,
	m_setStoreTags: Set<number>,
	mastersub_appid: number | string | undefined,
	mastersub_includedwith_logo: string | undefined,
	metacritic_score: number | undefined,
	minutes_playtime_forever: number,
	minutes_playtime_last_two_weeks: number,
	most_available_clientid: string,
	most_available_per_client_data: SteamGameClientData,
	mru_index: number | undefined,
	optional_parent_app_id: number | string | undefined,
	owner_account_id: number | string | undefined,
	per_client_data: SteamGameClientData[],
	review_percentage_with_bombs: number,
	review_percentage_without_bombs: number,
	review_score_with_bombs: number,
	review_score_without_bombs: number,
	rt_custom_image_mtime: string | undefined,
	rt_last_time_locally_played: number | undefined,
	rt_last_time_played: number,
	rt_last_time_played_or_installed: number,
	rt_original_release_date: number,
	rt_purchased_time: number | undefined,
	rt_recent_activity_time: number,
	rt_steam_release_date: number,
	rt_store_asset_mtime: number,
	selected_clientid: string,
	selected_per_client_data: SteamGameClientData,
	shortcut_override_appid: undefined,
	site_license_site_name: string | undefined,
	sort_as: string,
	third_party_mod: number | string | undefined,
	visible_in_game_list: boolean,
	vr_only: boolean | undefined,
	vr_supported: boolean | undefined,
	BHasStoreTag: (number) => boolean,
	BHasStoreCategory: (number) => boolean,
	active_beta: number | string | undefined,
	display_status: number,
	installed: boolean,
	is_available_on_current_platform: boolean,
	is_invalid_os_type: boolean | undefined,
	review_percentage: number,
	review_score: number,
	status_percentage: number,
	store_category: number[],
	store_tag: number[],
}

type SteamTab = {
	title: string,
	id: string,
	content: ReactElement,
	footer?: {
		onOptrionActionsDescription: string,
		onOptionsButtion: () => any,
		onSecondaryActionDescription: ReactElement,
		onSecondaryButton: () => any
	},
	renderTabAddon: () => ReactElement
}

type SteamCollection = {
	__proto__: SteamCollection
	AsDeletableCollection: () => null
	AsDragDropCollection: () => null
	AsEditableCollection: () => null
	GetAppCountWithToolsFilter: (t: any) => any
	allApps: SteamAppOverview[]
	apps: Map<number, SteamAppOverview>
	bAllowsDragAndDrop: boolean
	bIsDeletable: boolean
	bIsDynamic: boolean
	bIsEditable: boolean
	displayName: string
	id: string,
	visibleApps: SteamAppOverview[]
}

type CollectionStore = {
	userCollections: SteamCollection[]
	GetUserCollectionsByName: (name: string) => SteamCollection[]
	allAppsCollection: SteamCollection,
	deckDesktopApps: SteamCollection;
}

type AppData = {
	"details": SteamAppDetails,
	"socialMediaData": any,
	"associationData": {
		rgDevelopers: {
			strName: string,
			strURL: string
		}[],
		rgPublishers: {
			strName: string,
			strURL: string
		}[]
		rgFranchises: {
			strName: string,
			strURL: string
		}[]
	} | undefined,
	"appDetailsSpotlight": null,
	"descriptionsData": {
		strFullDescription: ReactNode,
		strSnippet: ReactNode
	} | undefined,
	"screenshots": null,
	"customImageInfoRtime": number,
	"cRegistered": 0,
	"listeners": [],
	"hAppDetails": {},
	"bLoadingAchievments": boolean
}

type AppDetailsStore = {
	__proto__: AppDetailsStore;
	GetAppDetails(id: number): SteamAppDetails,
	RegisterForAppData(app_id: any, callback: (data: SteamAppDetails) => void): Hook
	GetAchievements(app_id: number): SteamAppAchievements;
	GetAppData(app_id: number): AppData;
}

type AppStore = {
	m_mapApps: ObservableMap<number, SteamAppOverview>;
	UpdateAppOverview: any,
	GetAppOverviewByAppID: (id: number) => SteamAppOverview,
	GetAppOverviewByGameID: (id: string) => SteamAppOverview,
	CompareSortAs: any,
	allApps: SteamAppOverview[],
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

type UIStore = {
	collectionsAppFilter: any
}