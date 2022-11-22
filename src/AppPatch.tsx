import {
	afterPatch, findInReactTree,
	RoutePatch,
	ServerAPI, ServerResponse,
	wrapReactClass,
	wrapReactType
} from "decky-frontend-lib";
import {ReactElement} from "react";
import {AppOverview} from "./SteamClient";
import {MetadataManager} from "./MetadataManager";
import {PlayTimes} from "./Interfaces";

export const patchAppPage = (serverAPI: ServerAPI, metadataManager: MetadataManager): RoutePatch =>
{
	// @ts-ignore
	return serverAPI.routerHook.addPatch("/library/app/:appid", (props: { path: string, children: ReactElement }) =>
	{
		afterPatch(
				props.children.props,
				"renderFunc",
				(_: Record<string, unknown>[], ret1: ReactElement) =>
				{
					const overview: AppOverview = ret1.props.children.props.overview;
					const game_id = overview.m_gameid;
					// const details: AppDetails = ret1.props.children.props.details;

					// const appId: number = overview.appid;
					if (overview.app_type==1073741824)
					{
						serverAPI.callPluginMethod<{}, PlayTimes>("get_playtimes", {}).then((response: ServerResponse<PlayTimes>) =>
						{
							if (response.success)
							{
								// console.log(response.result)
								if (response.result[game_id])
								{
									ret1.props.children.props.details.nPlaytimeForever = +(response.result[game_id] / 60.0).toFixed(1);
									console.log(+(response.result[game_id] / 60.0).toFixed(1));
								}
							}
						});
						console.log("level1", ret1);
						wrapReactType(ret1.props.children);
						afterPatch(
								ret1.props.children.type,
								"type",
								(_: Record<string, unknown>[], ret2: ReactElement) =>
								{
									console.log("level2", ret2);
									let element = findInReactTree(ret2, x => x?.props?.onTheaterMode);
									wrapReactClass(element);
									afterPatch(
											element.type.prototype,
											"render",
											(_: Record<string, unknown>[], ret3: ReactElement) =>
											{
												console.log("level3", ret3);
												let element2 = findInReactTree(ret3, x => x?.props?.setSections);
												afterPatch(
														element2,
														"type",
														(_: Record<string, unknown>[], ret4: ReactElement) =>
														{
															console.log("level4", ret4);
															(ret4.props.setSections as Set<string>).delete("nonsteam");
															(ret4.props.setSections as Set<string>).delete("spotlightdlc");
															(ret4.props.setSections as Set<string>).delete("spotlightreview");
															(ret4.props.setSections as Set<string>).delete("spotlight");
															(ret4.props.setSections as Set<string>).delete("broadcast");
															(ret4.props.setSections as Set<string>).delete("friends");
															if (!window.DeckyPluginLoader.plugins.some(value => value.name === "Emuchievements"))
																(ret4.props.setSections as Set<string>).delete("achievements");
															(ret4.props.setSections as Set<string>).delete("cards");
															(ret4.props.setSections as Set<string>).delete("dlc");
															(ret4.props.setSections as Set<string>).delete("review");
															(ret4.props.setSections as Set<string>).delete("activity");
															(ret4.props.setSections as Set<string>).delete("activityrollup");
															(ret4.props.setSections as Set<string>).delete("community");
															(ret4.props.setSections as Set<string>).delete("additionalcontent");
															(ret4.props.setSections as Set<string>).delete("mastersubincluded");
															(ret4.props.setSections as Set<string>).delete("timedtrialbanner");
															(ret4.props.setSections as Set<string>).delete("workshop");
															(ret4.props.setSections as Set<string>).delete("info");
															return ret4;
														}
												);
												return ret3;
											}
									);
									return ret2;
								}
						);
						afterPatch(
								overview.__proto__,
								"GetCanonicalReleaseDate",
								function (_, ret)
								{
									metadataManager.should_bypass = true;
									return ret;
								}
						);
						afterPatch(
								overview.__proto__,
								"BIsModOrShortcut",
								function (_, ret)
								{
									if (ret === true)
									{
										const should_bypass = metadataManager.should_bypass
										console.log("should_bypass", should_bypass)
										metadataManager.should_bypass = false;
										return !should_bypass;
									}
									return ret;
								}
						);
					}
					return ret1;
				}
		);
		return props;
	});
}

export let _ = [
	{
		"value": "info"
	},
	{
		"value": "spotlightdlc"
	},
	{
		"value": "spotlightreview"
	},
	{
		"value": "spotlight"
	},
	{
		"value": "broadcast"
	},
	{
		"value": "friends"
	},
	{
		"value": "achievements"
	},
	{
		"value": "cards"
	},
	{
		"value": "dlc"
	},
	{
		"value": "screenshots"
	},
	{
		"value": "review"
	},
	{
		"value": "activity"
	},
	{
		"value": "activityrollup"
	},
	{
		"value": "community"
	},
	{
		"value": "additionalcontent"
	},
	{
		"value": "mastersubincluded"
	},
	{
		"value": "timedtrialbanner"
	},
	{
		"value": "workshop"
	}
]