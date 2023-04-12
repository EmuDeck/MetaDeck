import {ServerAPI} from "decky-frontend-lib";
import {MetadataManager} from "./MetadataManager";

export interface AppProps
{
	serverAPI: ServerAPI,
	metadataManager: () => MetadataManager
}

export interface MetadataData
{
	last_updated_at: Date,
	release_date?: number,
	title: string,
	id: number,
	description: string,
	developers?: Developer[],
	publishers?: Publisher[],
	compat_category: SteamDeckCompatCategory,

	store_categories: StoreCategory[],
}

export interface MetadataDictionary
{
	[index: number]: MetadataData
}

export interface MetadataIdDictionary
{
	[index: number]: number
}

export interface HTTPResult
{
	body: string,
	status: number
}

export interface Game
{
	id: number,
	game_title: string,
	release_date: string,
	platform: number,
	players: number,
	overview: string,
	last_updated: string,
	rating: string,
	coop: string,
	youtube: string,
	os: string,
	processor: string,
	ram: string,
	hdd: string,
	video: string,
	sound: string,
	developers: number[],
	genres: number[],
	publishers: number[],
	alternates: string[]
}

export interface Developer
{
	url: string,
	name: string
}

export interface Publisher
{
	url: string,
	name: string
}

export enum YesNo
{
	NO = "No",
	YES = "Yes"
}

export enum SteamDeckCompatCategory
{
	UNKNOWN,
	UNSUPPORTED,
	PLAYABLE,
	VERIFIED
}

export enum StoreCategory
{
	MultiPlayer = 1,
	SinglePlayer = 2,
	CoOp = 9,
	PartialController = 18,
	MMO = 20,
	Achievements = 22,
	SteamCloud = 23,
	SplitScreen = 24,
	CrossPlatformMultiPlayer = 27,
	FullController = 28,
	TradingCards = 29,
	Workshop = 30,
	VRSupport = 31,
	OnlineMultiPlayer = 36,
	LocalMultiPlayer = 37,
	OnlineCoOp = 38,
	LocalCoOp = 392,
	RemotePlayTogether = 44,
	HighQualitySoundtrackAudio = 50
}

export interface VerifiedDBResults
{
	"Timestamp": string,
	"Console": string,
	"Game": string,
	"Emulator": string,
	"Boots?": YesNo,
	"Playable?": YesNo
}

