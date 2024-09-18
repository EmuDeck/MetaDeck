export interface MetadataData
{
	title: string,
	id: number,
	description: string,
	developers?: Developer[],
	publishers?: Publisher[],
	release_date?: number,
	compat_category: SteamDeckCompatCategory,
	compat_notes?: string,
	store_categories: StoreCategory[],
}

export type MetadataDictionary = Record<number, MetadataData>

export type MetadataIdDictionary = Record<number, number>

export type MetadataCustomDictionary = Record<number, boolean>

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
	name: string,
	url: string
}

export interface Publisher
{
	name: string,
	url: string
}

export enum YesNo
{
	NO = "No",
	YES = "Yes",
	PARTIAL = "Partial"
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
	"Boots": YesNo,
	"Playable": YesNo,
	"Notes": string
}

