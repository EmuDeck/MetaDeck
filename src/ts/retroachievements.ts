import {getAppDetails} from "./util";

export const romRegex = /(\/([^\/"])+)+(?!\.AppImage)(\.zip|\.7z|\.iso|\.bin|\.chd|\.cue|\.img|\.a26|\.lnx|\.ngp|\.ngc|\.3dsx|\.3ds|\.app|\.axf|\.cci|\.cxi|\.elf|\.n64|\.ndd|\.u1|\.v64|\.z64|\.nds|\.dmg|\.gbc|\.gba|\.gb|\.ciso|\.dol|\.gcm|\.gcz|\.nkit\.iso|\.rvz|\.wad|\.wia|\.wbfs|\.nes|\.fds|\.unif|\.unf|\.json|\.kp|\.nca|\.nro|\.nso|\.nsp|\.xci|\.rpx|\.wud|\.wux|\.wua|\.32x|\.cdi|\.gdi|\.m3u|\.gg|\.gen|\.md|\.smd|\.sms|\.ecm|\.mds|\.pbp|\.dump|\.gz|\.mdf|\.mrg|\.prx|\.bs|\.fig|\.sfc|\.smc|\.swx|\.pc2|\.wsc|\.ws)/

export const limitedRomRegex = /(\/([^\/"])+)+(?!\.AppImage)(\.zip|\.7z|\.iso|\.bin|\.chd|\.cue|\.img|\.a26|\.lnx|\.ngp|\.ngc|\.elf|\.n64|\.ndd|\.u1|\.v64|\.z64|\.nds|\.dmg|\.gbc|\.gba|\.gb|\.ciso|\.nes|\.fds|\.unif|\.unf|\.32x|\.cdi|\.gdi|\.m3u|\.gg|\.gen|\.md|\.smd|\.sms|\.ecm|\.mds|\.pbp|\.dump|\.gz|\.mdf|\.mrg|\.prx|\.bs|\.fig|\.sfc|\.smc|\.swx|\.pc2|\.wsc|\.ws)/;

export const isEmulatedGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return romRegex.test(launchCommand);
}

export const isRetroAchievementsGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return limitedRomRegex.test(launchCommand);

}

export const isAchievementsGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	return await isRetroAchievementsGame(appId)
}

export const isFlatpakGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return launchCommand.includes("flatpak");
}

export const isEpicGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return launchCommand.includes("epic-launcher.sh") || launchCommand.includes("com.epicgames.launcher://apps/") || launchCommand.includes("heroic://launch/legendary/")
}

export const isGOGGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return launchCommand.includes("gog-launcher.sh") || launchCommand.includes("/command=runGame /gameId=") || launchCommand.includes("heroic://launch/gog/")
}

export const isJunkStoreGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return launchCommand.includes("epic-launcher.sh") || launchCommand.includes("gog-launcher.sh")
}

export const isNSLGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return launchCommand.includes("com.epicgames.launcher://apps/") || launchCommand.includes("/command=runGame /gameId=")
}

export const isHeroicGame: (appId: number) => Promise<boolean> = async (appId) =>
{
	const details = await getAppDetails(appId);

	let launchCommand: string
	if (details?.strShortcutLaunchOptions?.includes("%command%"))
		launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	else
		launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return launchCommand.includes("heroic://launch/legendary/") || launchCommand.includes("heroic://launch/gog/")
}

export const isLutrisGame: (appId: number) => Promise<boolean> = async (_appId) =>
{
	// const details = await getAppDetails(appId);
	//
	// let launchCommand: string
	// if (details?.strShortcutLaunchOptions?.includes("%command%"))
	// 	launchCommand = details?.strShortcutLaunchOptions?.replace("%command%", details?.strShortcutExe)
	// else
	// 	launchCommand = `${details?.strShortcutExe} ${details?.strShortcutLaunchOptions}`

	return false;
}



export enum RA_SYSTEM
{
	RC_CONSOLE_MEGA_DRIVE = 1,
	RC_CONSOLE_NINTENDO_64 = 2,
	RC_CONSOLE_SUPER_NINTENDO = 3,
	RC_CONSOLE_GAMEBOY = 4,
	RC_CONSOLE_GAMEBOY_ADVANCE = 5,
	RC_CONSOLE_GAMEBOY_COLOR = 6,
	RC_CONSOLE_NINTENDO = 7,
	RC_CONSOLE_PC_ENGINE = 8,
	RC_CONSOLE_SEGA_CD = 9,
	RC_CONSOLE_SEGA_32X = 10,
	RC_CONSOLE_MASTER_SYSTEM = 11,
	RC_CONSOLE_PLAYSTATION = 12,
	RC_CONSOLE_ATARI_LYNX = 13,
	RC_CONSOLE_NEOGEO_POCKET = 14,
	RC_CONSOLE_GAME_GEAR = 15,
	RC_CONSOLE_GAMECUBE = 16,
	RC_CONSOLE_ATARI_JAGUAR = 17,
	RC_CONSOLE_NINTENDO_DS = 18,
	RC_CONSOLE_WII = 19,
	RC_CONSOLE_WII_U = 20,
	RC_CONSOLE_PLAYSTATION_2 = 21,
	RC_CONSOLE_XBOX = 22,
	RC_CONSOLE_MAGNAVOX_ODYSSEY2 = 23,
	RC_CONSOLE_POKEMON_MINI = 24,
	RC_CONSOLE_ATARI_2600 = 25,
	RC_CONSOLE_MS_DOS = 26,
	RC_CONSOLE_ARCADE = 27,
	RC_CONSOLE_VIRTUAL_BOY = 28,
	RC_CONSOLE_MSX = 29,
	RC_CONSOLE_COMMODORE_64 = 30,
	RC_CONSOLE_ZX81 = 31,
	RC_CONSOLE_ORIC = 32,
	RC_CONSOLE_SG1000 = 33,
	RC_CONSOLE_VIC20 = 34,
	RC_CONSOLE_AMIGA = 35,
	RC_CONSOLE_ATARI_ST = 36,
	RC_CONSOLE_AMSTRAD_PC = 37,
	RC_CONSOLE_APPLE_II = 38,
	RC_CONSOLE_SATURN = 39,
	RC_CONSOLE_DREAMCAST = 40,
	RC_CONSOLE_PSP = 41,
	RC_CONSOLE_CDI = 42,
	RC_CONSOLE_3DO = 43,
	RC_CONSOLE_COLECOVISION = 44,
	RC_CONSOLE_INTELLIVISION = 45,
	RC_CONSOLE_VECTREX = 46,
	RC_CONSOLE_PC8800 = 47,
	RC_CONSOLE_PC9800 = 48,
	RC_CONSOLE_PCFX = 49,
	RC_CONSOLE_ATARI_5200 = 50,
	RC_CONSOLE_ATARI_7800 = 51,
	RC_CONSOLE_X68K = 52,
	RC_CONSOLE_WONDERSWAN = 53,
	RC_CONSOLE_CASSETTEVISION = 54,
	RC_CONSOLE_SUPER_CASSETTEVISION = 55,
	RC_CONSOLE_NEO_GEO_CD = 56,
	RC_CONSOLE_FAIRCHILD_CHANNEL_F = 57,
	RC_CONSOLE_FM_TOWNS = 58,
	RC_CONSOLE_ZX_SPECTRUM = 59,
	RC_CONSOLE_GAME_AND_WATCH = 60,
	RC_CONSOLE_NOKIA_NGAGE = 61,
	RC_CONSOLE_NINTENDO_3DS = 62,
	RC_CONSOLE_SUPERVISION = 63,
	RC_CONSOLE_SHARPX1 = 64,
	RC_CONSOLE_TIC80 = 65,
	RC_CONSOLE_THOMSONTO8 = 66,
	RC_CONSOLE_PC6000 = 67,
	RC_CONSOLE_PICO = 68,
	RC_CONSOLE_MEGADUCK = 69,
	RC_CONSOLE_ZEEBO = 70,
	RC_CONSOLE_ARDUBOY = 71,
	RC_CONSOLE_WASM4 = 72,
	RC_CONSOLE_ARCADIA_2001 = 73,
	RC_CONSOLE_INTERTON_VC_4000 = 74,
	RC_CONSOLE_ELEKTOR_TV_GAMES_COMPUTER = 75,
	RC_CONSOLE_PC_ENGINE_CD = 76,
	RC_CONSOLE_ATARI_JAGUAR_CD = 77,
	RC_CONSOLE_NINTENDO_DSI = 78,
	RC_CONSOLE_TI83 = 79,
	RC_CONSOLE_UZEBOX = 80
}

const retroarchRegex: (core: string) => RegExp = (core) => new RegExp(`(${core}\\.)(so|dll|dylib)`)

export const RA_SYSTEM_REGEX: Record<RA_SYSTEM, RegExp[]> = {
	[RA_SYSTEM.RC_CONSOLE_MEGA_DRIVE]: [retroarchRegex("genesis_plus_gx_libretro"), retroarchRegex("genesis_plus_gx_wide_libretro")],
	[RA_SYSTEM.RC_CONSOLE_NINTENDO_64]: [retroarchRegex("mupen64plus_next_libretro"), /rosaliesmupengui.sh/],
	[RA_SYSTEM.RC_CONSOLE_SUPER_NINTENDO]: [],
	[RA_SYSTEM.RC_CONSOLE_GAMEBOY]: [],
	[RA_SYSTEM.RC_CONSOLE_GAMEBOY_ADVANCE]: [],
	[RA_SYSTEM.RC_CONSOLE_GAMEBOY_COLOR]: [],
	[RA_SYSTEM.RC_CONSOLE_NINTENDO]: [],
	[RA_SYSTEM.RC_CONSOLE_PC_ENGINE]: [],
	[RA_SYSTEM.RC_CONSOLE_SEGA_CD]: [],
	[RA_SYSTEM.RC_CONSOLE_SEGA_32X]: [],
	[RA_SYSTEM.RC_CONSOLE_MASTER_SYSTEM]: [],
	[RA_SYSTEM.RC_CONSOLE_PLAYSTATION]: [],
	[RA_SYSTEM.RC_CONSOLE_ATARI_LYNX]: [],
	[RA_SYSTEM.RC_CONSOLE_NEOGEO_POCKET]: [],
	[RA_SYSTEM.RC_CONSOLE_GAME_GEAR]: [],
	[RA_SYSTEM.RC_CONSOLE_GAMECUBE]: [],
	[RA_SYSTEM.RC_CONSOLE_ATARI_JAGUAR]: [],
	[RA_SYSTEM.RC_CONSOLE_NINTENDO_DS]: [],
	[RA_SYSTEM.RC_CONSOLE_WII]: [],
	[RA_SYSTEM.RC_CONSOLE_WII_U]: [],
	[RA_SYSTEM.RC_CONSOLE_PLAYSTATION_2]: [],
	[RA_SYSTEM.RC_CONSOLE_XBOX]: [],
	[RA_SYSTEM.RC_CONSOLE_MAGNAVOX_ODYSSEY2]: [],
	[RA_SYSTEM.RC_CONSOLE_POKEMON_MINI]: [],
	[RA_SYSTEM.RC_CONSOLE_ATARI_2600]: [],
	[RA_SYSTEM.RC_CONSOLE_MS_DOS]: [],
	[RA_SYSTEM.RC_CONSOLE_ARCADE]: [],
	[RA_SYSTEM.RC_CONSOLE_VIRTUAL_BOY]: [],
	[RA_SYSTEM.RC_CONSOLE_MSX]: [],
	[RA_SYSTEM.RC_CONSOLE_COMMODORE_64]: [],
	[RA_SYSTEM.RC_CONSOLE_ZX81]: [],
	[RA_SYSTEM.RC_CONSOLE_ORIC]: [],
	[RA_SYSTEM.RC_CONSOLE_SG1000]: [],
	[RA_SYSTEM.RC_CONSOLE_VIC20]: [],
	[RA_SYSTEM.RC_CONSOLE_AMIGA]: [],
	[RA_SYSTEM.RC_CONSOLE_ATARI_ST]: [],
	[RA_SYSTEM.RC_CONSOLE_AMSTRAD_PC]: [],
	[RA_SYSTEM.RC_CONSOLE_APPLE_II]: [],
	[RA_SYSTEM.RC_CONSOLE_SATURN]: [],
	[RA_SYSTEM.RC_CONSOLE_DREAMCAST]: [],
	[RA_SYSTEM.RC_CONSOLE_PSP]: [],
	[RA_SYSTEM.RC_CONSOLE_CDI]: [],
	[RA_SYSTEM.RC_CONSOLE_3DO]: [],
	[RA_SYSTEM.RC_CONSOLE_COLECOVISION]: [],
	[RA_SYSTEM.RC_CONSOLE_INTELLIVISION]: [],
	[RA_SYSTEM.RC_CONSOLE_VECTREX]: [],
	[RA_SYSTEM.RC_CONSOLE_PC8800]: [],
	[RA_SYSTEM.RC_CONSOLE_PC9800]: [],
	[RA_SYSTEM.RC_CONSOLE_PCFX]: [],
	[RA_SYSTEM.RC_CONSOLE_ATARI_5200]: [],
	[RA_SYSTEM.RC_CONSOLE_ATARI_7800]: [],
	[RA_SYSTEM.RC_CONSOLE_X68K]: [],
	[RA_SYSTEM.RC_CONSOLE_WONDERSWAN]: [],
	[RA_SYSTEM.RC_CONSOLE_CASSETTEVISION]: [],
	[RA_SYSTEM.RC_CONSOLE_SUPER_CASSETTEVISION]: [],
	[RA_SYSTEM.RC_CONSOLE_NEO_GEO_CD]: [],
	[RA_SYSTEM.RC_CONSOLE_FAIRCHILD_CHANNEL_F]: [],
	[RA_SYSTEM.RC_CONSOLE_FM_TOWNS]: [],
	[RA_SYSTEM.RC_CONSOLE_ZX_SPECTRUM]: [],
	[RA_SYSTEM.RC_CONSOLE_GAME_AND_WATCH]: [],
	[RA_SYSTEM.RC_CONSOLE_NOKIA_NGAGE]: [],
	[RA_SYSTEM.RC_CONSOLE_NINTENDO_3DS]: [],
	[RA_SYSTEM.RC_CONSOLE_SUPERVISION]: [],
	[RA_SYSTEM.RC_CONSOLE_SHARPX1]: [],
	[RA_SYSTEM.RC_CONSOLE_TIC80]: [],
	[RA_SYSTEM.RC_CONSOLE_THOMSONTO8]: [],
	[RA_SYSTEM.RC_CONSOLE_PC6000]: [],
	[RA_SYSTEM.RC_CONSOLE_PICO]: [],
	[RA_SYSTEM.RC_CONSOLE_MEGADUCK]: [],
	[RA_SYSTEM.RC_CONSOLE_ZEEBO]: [],
	[RA_SYSTEM.RC_CONSOLE_ARDUBOY]: [],
	[RA_SYSTEM.RC_CONSOLE_WASM4]: [],
	[RA_SYSTEM.RC_CONSOLE_ARCADIA_2001]: [],
	[RA_SYSTEM.RC_CONSOLE_INTERTON_VC_4000]: [],
	[RA_SYSTEM.RC_CONSOLE_ELEKTOR_TV_GAMES_COMPUTER]: [],
	[RA_SYSTEM.RC_CONSOLE_PC_ENGINE_CD]: [],
	[RA_SYSTEM.RC_CONSOLE_ATARI_JAGUAR_CD]: [],
	[RA_SYSTEM.RC_CONSOLE_NINTENDO_DSI]: [],
	[RA_SYSTEM.RC_CONSOLE_TI83]: [],
	[RA_SYSTEM.RC_CONSOLE_UZEBOX]: []
}