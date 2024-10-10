export interface GamesDBResult {
	id:                          string;
	game_id:                     string;
	platform_id:                 PlatformID;
	external_id:                 string;
	dlcs_ids:                    any[];
	dlcs:                        any[];
	parent_id:                   null;
	supported_operating_systems: SupportedOperatingSystem[];
	available_languages:         AvailableLanguage[];
	first_release_date:          null;
	game:                        Game;
	title:                       SortingTitle;
	sorting_title:               SortingTitle;
	type:                        string;
	summary:                     SortingTitle;
	videos:                      any[];
	game_modes:                  GameMode[];
	icon:                        Icon;
	logo:                        Icon;
}

export interface AvailableLanguage {
	code: string;
}

export interface Game {
	id:                         string;
	parent_id:                  null;
	dlcs_ids:                   string[];
	first_release_date:         string;
	releases:                   Release[];
	title:                      SortingTitle;
	sorting_title:              SortingTitle;
	type:                       string;
	developers_ids:             string[];
	developers:                 GameMode[];
	publishers_ids:             string[];
	publishers:                 GameMode[];
	genres_ids:                 string[];
	genres:                     Genre[];
	themes_ids:                 string[];
	themes:                     Genre[];
	screenshots:                Icon[];
	videos:                     Video[];
	artworks:                   Icon[];
	summary:                    SortingTitle;
	visible_in_library:         boolean;
	aggregated_rating:          number;
	game_modes:                 GameMode[];
	horizontal_artwork:         Icon;
	background:                 Icon;
	vertical_cover:             Icon;
	cover:                      Icon;
	logo:                       Icon;
	icon:                       Icon;
	square_icon:                Icon;
	global_popularity_all_time: number;
	global_popularity_current:  number;
}

export interface Icon {
	url_format: string;
}

export interface GameMode {
	id:   string;
	name: string;
	slug: string;
}

export interface Genre {
	id:   string;
	name: SortingTitle;
	slug: string;
}

export interface SortingTitle {
	"*":     string;
	"en-US": string;
}

export interface Release {
	id:                      string;
	platform_id:             PlatformID;
	external_id:             string;
	release_per_platform_id: string;
}

export enum PlatformID {
	Epic = "epic",
	Fanatical = "fanatical",
	Generic = "generic",
	Humble = "humble",
	Origin = "origin",
	Playfire = "playfire",
	Steam = "steam",
	Test = "test",
}

export interface Video {
	provider:     string;
	video_id:     string;
	thumbnail_id: string;
	name:         string;
}

export interface SupportedOperatingSystem {
	slug: string;
	name: string;
}

export const removeBeforeAndIncluding = (originalString: string, substring: string) => {
	// Find the index of the substring
	const index = originalString.indexOf(substring);

	// If the substring is found, slice the string from the end of the substring
	if (index !== -1)
	{
		return originalString.slice(index + substring.length);
	}

	// If the substring is not found, return the original string
	return originalString;
}

export const removeAfterAndIncluding = (originalString: string, substring: string) => {
	// Find the index of the substring
	const index = originalString.indexOf(substring);

	// If the substring is found, slice the string from the end of the substring
	if (index !== -1)
	{
		return originalString.slice(0, index);
	}

	// If the substring is not found, return the original string
	return originalString;
}
