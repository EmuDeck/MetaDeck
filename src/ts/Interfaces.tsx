import {IconType} from "react-icons";
import {SiEpicgames, SiFlatpak, SiLutris, SiPrime} from "react-icons/si";

import languages from "./translations";
import {FaRocket, FaTrash} from "react-icons/fa";

export interface MetadataData
{
	title: string,
	id: number | string,
	description: string,
	developers?: Developer[],
	publishers?: Publisher[],
	release_date?: number,
	rating?: number,
	install_size?: number,
	install_date?: number,
	store_categories: (StoreCategory | CustomStoreCategory)[]
}

export interface CompatdataData
{
	compat_category?: SteamDeckCompatCategory,
	compat_notes?: string,
}

export type IdDictionary = Record<number, number | string>

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

export enum CustomStoreCategory
{
	NonSteam = 10000,
	EmuDeck = 10001,
	Epic = 10002,
	GOG = 10003,
	NSL = 10004,
	JunkStore = 10005,
	Heroic = 10006,
	Lutris = 10007,
	Prime = 10008,
	Flatpak = 10009
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

const NonSteam: IconType = (props) =>
	   <svg
			 viewBox="0 0 164 164"
			 stroke="currentColor"
			 fill="currentColor"
			 width={164}
			 height={164}
			 {...props}
	   >
		   <defs id="defs2"/>
		   <path d="M 82,0.75 C 37.2,0.75 0.75,37.2 0.75,82 c 0,44.8 36.45,81.25 81.25,81.25 44.8,0 81.25,-36.45 81.25,-81.25 C 163.25,37.2 126.8,0.75 82,0.75 Z m 0,12.5 c 37.906,0 68.75,30.8437 68.75,68.75 0,37.906 -30.844,68.75 -68.75,68.75 -31.9282,0 -58.759,-21.911 -66.4551,-51.4648 L 38.4575,109.1 c 1.0547,9.356 8.9044,16.65 18.5425,16.65 10.3562,0 18.75,-8.394 18.75,-18.75 0,-0.2 -0.0548,-0.392 -0.061,-0.586 L 101.8,88.1523 C 115.112,87.5898 125.75,76.7 125.75,63.25 c 0,-13.8063 -11.194,-25 -25,-25 -13.45,0 -24.3339,10.6377 -24.8901,23.9502 L 57.5859,88.311 C 57.3859,88.3048 57.2,88.25 57,88.25 c -4.1456,0 -7.9432,1.3846 -11.0474,3.6621 L 13.4575,77.9839 C 15.5554,41.9497 45.4494,13.25 82,13.25 Z m 18.75,31.25 c 10.356,0 18.75,8.3938 18.75,18.75 C 119.5,73.6062 111.106,82 100.75,82 90.3938,82 82,73.6062 82,63.25 82,52.8938 90.3938,44.5 100.75,44.5 Z m 0,6.25 c -3.3152,0 -6.4946,1.317 -8.8388,3.6612 -2.3442,2.3442 -3.6612,5.5236 -3.6612,8.8388 0,3.3152 1.317,6.4946 3.6612,8.8388 2.3442,2.3442 5.5236,3.6612 8.8388,3.6612 3.315,0 6.495,-1.317 8.839,-3.6612 2.344,-2.3442 3.661,-5.5236 3.661,-8.8388 0,-3.3152 -1.317,-6.4946 -3.661,-8.8388 C 107.245,52.067 104.065,50.75 100.75,50.75 Z M 57,94.5 c 6.9063,0 12.5,5.594 12.5,12.5 0,6.906 -5.5937,12.5 -12.5,12.5 -5.0549,0 -9.3827,-3.01 -11.3525,-7.324 l 4.895,2.099 c 1.2,0.519 2.4553,0.769 3.6865,0.769 3.6375,0 7.1054,-2.132 8.6304,-5.688 C 64.8969,104.6 62.6902,99.0888 57.9277,97.0513 L 53.3745,95.0981 C 54.5296,94.7462 55.7294,94.5 57,94.5 Z"/>
		   <rect
				 x={-6.0005035}
				 y={-196.22072}
				 width={12}
				 height={159.108}
				 transform="rotate(135)"
		   />
	   </svg>

const EmuDeck: IconType = (props) =>
	   <svg
			 viewBox="0 0 200.473 200.46691"
			 stroke="currentColor"
			 fill="currentColor"
			 width="200.47301"
			 height="200.4669"
			 {...props}
	   >
		   <defs
				 id="defs3">
			   <clipPath
					 id="b">
				   <path
						 fill="transparent"
						 stroke="#000000"
						 strokeWidth="4"
						 className="path"
						 d="M 76.28,181.33 21,126.05 c -4.01,-4.01 -5.16,-9.8 -3.47,-14.84 0.69,-2.05 1.84,-3.98 3.47,-5.61 L 31.11,95.49 96.42,30.17 v 131.27 l -0.09,11.69 c -0.03,3.1 -1.25,6.01 -3.44,8.21 -2.29,2.29 -5.3,3.43 -8.3,3.43 -3,0 -6.01,-1.15 -8.3,-3.43 M 112.14,16.5 c 0.95,-0.33 1.93,-0.56 2.92,-0.68 0.66,-0.08 1.32,-0.12 1.99,-0.11 0.33,0 0.66,0.02 0.99,0.04 a 14.379,14.379 0 0 1 9.07,4.18 l 55.28,55.28 c 0.45,0.45 0.84,0.94 1.21,1.44 0.33,0.45 0.63,0.92 0.89,1.4 0.18,0.34 0.34,0.69 0.48,1.04 0.29,0.71 0.5,1.44 0.64,2.18 a 12.05,12.05 0 0 1 0,4.48 c -0.14,0.74 -0.36,1.47 -0.64,2.18 -0.14,0.35 -0.3,0.7 -0.48,1.04 a 11.82,11.82 0 0 1 -3.86,4.3 c -0.63,0.42 -1.3,0.78 -1.99,1.07 a 11.9,11.9 0 0 1 -4.44,0.91 l -23.37,0.19 c -0.3,0 -0.59,0.02 -0.88,0.03 H 112.16 V 16.5 Z m 0,-16.13 c -5.71,0.9 -11.2,3.44 -15.72,7.61 -0.3,0.27 -0.59,0.55 -0.88,0.84 L 9.88,94.48 c -0.33,0.33 -0.64,0.66 -0.95,1 A 29.925,29.925 0 0 0 1.42,111.2 c -1.41,9.18 1.41,18.9 8.47,25.96 l 55.28,55.28 c 8.44,8.44 21.05,10.22 31.26,5.36 2.74,-1.31 5.31,-3.09 7.58,-5.36 5.13,-5.13 7.98,-11.95 8.04,-19.2 l 0.09,-11.68 V 111.2 h 38.3 c 0.17,0 0.33,-0.03 0.5,-0.03 l 23.37,-0.19 c 7.25,-0.06 14.07,-2.91 19.2,-8.04 2.23,-2.23 3.99,-4.76 5.3,-7.46 4.94,-10.23 3.18,-22.91 -5.3,-31.38 L 138.22,8.82 C 132.34,2.94 124.61,0 116.89,0 c -1.59,0 -3.18,0.12 -4.75,0.37"
						 id="path2"/>
			   </clipPath>
			   <clipPath
					 id="c">
				   <path fill="#040404"

					    strokeWidth="4"
					    className="path"
					    d="m 63.59,99.73 -4.92,4.92 -4.92,-4.92 a 7.864,7.864 0 0 0 -11.12,0 7.864,7.864 0 0 0 0,11.12 l 4.92,4.92 -4.92,4.92 a 7.864,7.864 0 0 0 0,11.12 7.864,7.864 0 0 0 11.12,0 l 4.92,-4.92 4.92,4.92 a 7.864,7.864 0 0 0 11.12,0 7.864,7.864 0 0 0 0,-11.12 l -4.92,-4.92 4.92,-4.92 a 7.864,7.864 0 0 0 0,-11.12 c -1.54,-1.54 -3.55,-2.3 -5.56,-2.3 -2.01,0 -4.02,0.77 -5.56,2.3"
					    id="path3"/>
			   </clipPath>
		   </defs>
		   <g
				 clipPath="url(#b)"
				 id="g4"
				 transform="translate(-1.0675463)"
		   >
			   <path
					 d="M 0,0 H 203.74 V 202.67 H 0 Z"
					 id="path4"
			   />
		   </g>
		   <g
				 clipPath="url(#c)"
				 id="g5"
				 transform="translate(-1.0675463)"
		   >
			   <path
					 d="m 39.55,96.66 h 38.22 v 38.22 H 39.55 Z"
					 id="path5"
			   />
		   </g>
	   </svg>

const GOGGalaxy: IconType = (props) =>
	   <svg
			 viewBox="0 0 50 50"
			 stroke="currentColor"
			 fill="currentColor"
			 width="50px"
			 height="50px"
			 {...props}
	   >
		   <path d="M 25 2 C 12.317 2 2 12.318 2 25 C 2 37.682 12.317 48 25 48 C 37.683 48 48 37.682 48 25 C 48 12.318 37.683 2 25 2 z M 11.599609 13 L 17.400391 13 C 18.283391 13 19 13.715609 19 14.599609 L 19 24.400391 C 19 25.284391 18.284391 26 17.400391 26 L 10 26 L 10 24 L 16.400391 24 C 16.731391 24 17 23.731391 17 23.400391 L 17 15.599609 C 17 15.268609 16.731391 15 16.400391 15 L 12.599609 15 C 12.268609 15 12 15.268609 12 15.599609 L 12 19.400391 C 12 19.731391 12.268609 20 12.599609 20 L 15.5 20 L 15.5 22 L 11.599609 22 C 10.716609 22 10 21.284391 10 20.400391 L 10 14.599609 C 10 13.715609 10.715609 13 11.599609 13 z M 22.099609 13 L 27.900391 13 C 28.782391 13 29.5 13.717609 29.5 14.599609 L 29.5 20.400391 C 29.5 21.282391 28.782391 22 27.900391 22 L 22.099609 22 C 21.217609 22 20.5 21.282391 20.5 20.400391 L 20.5 14.599609 C 20.5 13.717609 21.217609 13 22.099609 13 z M 32.599609 13 L 38.400391 13 C 39.283391 13 40 13.715609 40 14.599609 L 40 24.400391 C 40 25.284391 39.284391 26 38.400391 26 L 31 26 L 31 24 L 37.400391 24 C 37.731391 24 38 23.731391 38 23.400391 L 38 15.599609 C 38 15.268609 37.731391 15 37.400391 15 L 33.599609 15 C 33.268609 15 33 15.268609 33 15.599609 L 33 19.400391 C 33 19.731391 33.268609 20 33.599609 20 L 36.5 20 L 36.5 22 L 32.599609 22 C 31.716609 22 31 21.284391 31 20.400391 L 31 14.599609 C 31 13.715609 31.715609 13 32.599609 13 z M 23.099609 15 C 22.768609 15 22.5 15.268609 22.5 15.599609 L 22.5 19.400391 C 22.5 19.731391 22.768609 20 23.099609 20 L 26.900391 20 C 27.231391 20 27.5 19.731391 27.5 19.400391 L 27.5 15.599609 C 27.5 15.268609 27.231391 15 26.900391 15 L 23.099609 15 z M 11.599609 28 L 17.5 28 L 17.5 30 L 12.599609 30 C 12.268609 30 12 30.268609 12 30.599609 L 12 34.400391 C 12 34.731391 12.268609 35 12.599609 35 L 17.5 35 L 17.5 37 L 11.599609 37 C 10.716609 37 10 36.284391 10 35.400391 L 10 29.599609 C 10 28.716609 10.715609 28 11.599609 28 z M 20.599609 28 L 26.400391 28 C 27.282391 28 28 28.717609 28 29.599609 L 28 35.400391 C 28 36.282391 27.282391 37 26.400391 37 L 20.599609 37 C 19.717609 37 19 36.282391 19 35.400391 L 19 29.599609 C 19 28.717609 19.717609 28 20.599609 28 z M 31.099609 28 L 40 28 L 40 37 L 38 37 L 38 30 L 36.349609 30 C 36.018609 30 35.75 30.268609 35.75 30.599609 L 35.75 37 L 33.75 37 L 33.75 30 L 32.099609 30 C 31.768609 30 31.5 30.268609 31.5 30.599609 L 31.5 37 L 29.5 37 L 29.5 29.599609 C 29.5 28.716609 30.215609 28 31.099609 28 z M 21.599609 30 C 21.268609 30 21 30.268609 21 30.599609 L 21 34.400391 C 21 34.731391 21.268609 35 21.599609 35 L 25.400391 35 C 25.731391 35 26 34.731391 26 34.400391 L 26 30.599609 C 26 30.268609 25.731391 30 25.400391 30 L 21.599609 30 z"/>
	   </svg>

const Heroic: IconType = (props) =>
	   <svg
			 viewBox="0 0 192 192"
			 stroke="currentColor"
			 fill="currentColor"
			 width={192}
			 height={192}
			 {...props}
	   >
		   <path
				 d="M 66.511,25.574 C 50.018,32.921 36.377,39.368 36.2,39.901 c -0.277,0.831 20.912,101.352 22.43,106.409 0.493,1.644 36.247,32.175 39.065,33.359 0.657,0.277 10.182,-6.736 21.167,-15.582 l 19.972,-16.085 1.135,-5.251 C 145.518,117.069 160.977,40.43 160.747,39.74 160.349,38.546 100.087,11.972 98.086,12.108 97.214,12.167 83.005,18.226 66.511,25.574 m 30.81,2.629 c -0.551,0.713 -3.378,5.495 -6.282,10.626 l -5.28,9.33 4.285,40.67 c 2.357,22.369 4.655,41.695 5.106,42.947 1.101,3.054 3.631,3.87 5.678,1.831 1.356,-1.352 2.458,-9.546 5.834,-43.387 L 110.823,48.5 105.437,39 C 98.141,26.13 98.526,26.643 97.321,28.203 m -23.337,106.547 -2.213,3.75 2.159,4.072 2.159,4.072 8.813,-1.445 c 7.753,-1.272 9.003,-1.769 10.397,-4.129 1.491,-2.524 1.455,-2.835 -0.607,-5.258 -1.733,-2.036 -3.697,-2.809 -9.385,-3.694 -9.495,-1.476 -8.803,-1.637 -11.323,2.632 m 36.106,-2.294 c -8.537,1.679 -11.092,4.95 -7.34,9.397 1.265,1.499 4.049,2.461 10.05,3.472 l 8.301,1.398 2.039,-3.998 c 1.973,-3.866 1.983,-4.127 0.298,-7.862 -1.975,-4.38 -2.671,-4.506 -13.348,-2.407 m -13.423,10.997 c -1.288,0.976 -2.134,3.646 -2.848,8.99 -1.165,8.717 -0.977,9.599 2.437,11.427 2.166,1.159 2.862,1.099 5.222,-0.448 2.684,-1.758 2.713,-1.894 2.039,-9.353 -0.627,-6.932 -2.475,-12.117 -4.29,-12.037 -0.4,0.017 -1.552,0.657 -2.56,1.421"
				 stroke="none"
				 fillRule="evenodd"
		   />
	   </svg>

export const customStoreIcons: Record<CustomStoreCategory, IconType> = {
	[CustomStoreCategory.NonSteam]: NonSteam,
	[CustomStoreCategory.EmuDeck]: EmuDeck,
	[CustomStoreCategory.Epic]: SiEpicgames,
	[CustomStoreCategory.GOG]: GOGGalaxy,
	[CustomStoreCategory.NSL]: FaRocket,
	[CustomStoreCategory.JunkStore]: FaTrash,
	[CustomStoreCategory.Heroic]: Heroic,
	[CustomStoreCategory.Lutris]: SiLutris,
	[CustomStoreCategory.Prime]: SiPrime,
	[CustomStoreCategory.Flatpak]: SiFlatpak
}

export const customStoreTitles: Record<CustomStoreCategory, keyof (typeof languages)['en']> = {
	[CustomStoreCategory.NonSteam]: "storeCategoriesNonSteam",
	[CustomStoreCategory.EmuDeck]: "storeCategoriesEmuDeck",
	[CustomStoreCategory.Epic]: "storeCategoriesEpic",
	[CustomStoreCategory.GOG]: "storeCategoriesGOG",
	[CustomStoreCategory.NSL]: "storeCategoriesNSL",
	[CustomStoreCategory.JunkStore]: "storeCategoriesJunkStore",
	[CustomStoreCategory.Heroic]: "storeCategoriesHeroic",
	[CustomStoreCategory.Lutris]: "storeCategoriesLutris",
	[CustomStoreCategory.Prime]: "storeCategoriesPrime",
	[CustomStoreCategory.Flatpak]: "storeCategoriesFlatpak"
}



