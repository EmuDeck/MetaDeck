import {ServerAPI} from "decky-frontend-lib";

export interface PlayTimes
{
	[key: string]: number
}

export interface GameActionStartParams
{
	idk: number,
	game_id: string,
	action: string
}

export interface ResetPlaytimeParams
{
	game_id: string
}

export interface AppProps
{
	serverAPI: ServerAPI
}

export interface AppState
{
	play_times: PlayTimes
}

export interface MetadataData
{
	last_updated_at: Date;
	id: number,
	description: string,
	developers: Developer[],
	publishers: Publisher[],
	compat_category: SteamDeckCompatCategory
}

export interface HTTPResult
{
	body: string,
	status: number
}

export interface BaseResults
{
	code: number,
	status: string,
	remaining_monthly_allowance: number,
	extra_allowance: number,
}

export interface PaginatedResults extends BaseResults
{
	pages: {
		previous: string,
		current: string,
		next: string
	}
}

export interface SearchResults extends PaginatedResults
{
	data: {
		count: number,
		games: Game[]
	}
}

export interface PublishersResults extends BaseResults
{
	data: {
		count: number,
		publishers: { [key: string]: Publisher }
	}
}


export interface DevelopersResults extends BaseResults
{
	data: {
		count: number,
		developers: { [key: string]: Developer }
	}
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
	id: number,
	name: string
}

export interface Publisher
{
	id: number,
	name: string
}

export enum YesNo
{
	NO= "No",
	YES="Yes"
}

export enum SteamDeckCompatCategory
{
	UNKNOWN,
	UNSUPPORTED,
	PLAYABLE,
	VERIFIED
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

