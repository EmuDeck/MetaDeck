import {
	afterPatch, findInReactTree,
	RoutePatch,
	ServerAPI, wrapReactClass,
	wrapReactType
} from "decky-frontend-lib";
import {ReactElement} from "react";
import {AppOverview} from "./SteamClient";
import {MetadataManager} from "./MetadataManager";

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
					// const details: AppDetails = ret1.props.children.props.details;

					// const appId: number = overview.appid;
					if (overview.app_type==1073741824)
					{
						wrapReactType(ret1.props.children);
						afterPatch(
								ret1.props.children.type,
								"type",
								(_: Record<string, unknown>[], ret2: ReactElement) =>
								{
									let element = findInReactTree(ret2, x => x?.props?.onTheaterMode);
									wrapReactClass(element);
									afterPatch(
											element.type.prototype,
											"render",
											(_: Record<string, unknown>[], ret3: ReactElement) =>
											{
												let element2 = findInReactTree(ret3, x => x?.props?.setSections);
												afterPatch(
														element2,
														"type",
														(_: Record<string, unknown>[], ret4: ReactElement) =>
														{
															(ret4.props.setSections as Set<string>).delete("nonsteam");
															(ret4.props.setSections as Set<string>).delete("spotlightdlc");
															(ret4.props.setSections as Set<string>).delete("spotlightreview");
															(ret4.props.setSections as Set<string>).delete("spotlight");
															(ret4.props.setSections as Set<string>).delete("broadcast");
															(ret4.props.setSections as Set<string>).delete("friends");
															if (!window.DeckyPluginLoader.plugins.some(value => value.name === "Emuchievements" || value.name === "EmuDecky"))
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