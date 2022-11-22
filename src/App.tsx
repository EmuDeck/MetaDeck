import {Component} from "react";
import {AppProps, AppState, PlayTimes, ResetPlaytimeParams} from "./Interfaces";
import {ButtonItem, PanelSection, PanelSectionRow, ServerResponse} from "decky-frontend-lib";
export class App extends Component<AppProps, AppState>
{
	state: Readonly<AppState> = {
		play_times: {}
	}

	loadState()
	{
		this.props.serverAPI.callPluginMethod<{}, PlayTimes>("get_playtimes", {}).then((response: ServerResponse<PlayTimes>) =>
		{
			if (response.success)
			{
				this.setState({
					play_times: response.result
				});
				console.log(this.state)
			}
		});
	}

	componentDidMount()
	{
		this.loadState()
	}

	render()
	{
		return (
				<PanelSection title="Reset Play Time">
					{
						(() =>
						{
							if (Object.entries(this.state.play_times).length)
								return Object.entries(this.state.play_times).map(([key, value]) =>
								{
									let overview = appStore.GetAppOverviewByGameID(key)
									if (overview)
										return (
												<PanelSectionRow key={key}>
													<ButtonItem onClick={() =>
													{
														this.props.serverAPI.callPluginMethod<ResetPlaytimeParams, {}>("reset_playtime", {game_id: key}).then(() =>
														{
															this.loadState();
															// console.log("SteamlessTimes reset", key, "previous time", value, "seconds")
															overview.minutes_playtime_forever = "0";
														})
													}} layout={"below"}>
														<div style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between'
														}}>
															Reset {overview.display_name}: {(() =>
															{
																if (+(value / 60.0).toFixed(1) < 60.0)
																{
																	if (+(value / 60.0).toFixed(1) == 60.0)
																		return (value / 60.0).toFixed(1) + " Minute"
																	return (value / 60.0).toFixed(1) + " Minutes"
																} else
																{
																	if (+((value / 60.0) / 60.0).toFixed(1) == 60.0)
																		return ((value / 60.0) / 60.0).toFixed(1) + " Hour"
																	return ((value / 60.0) / 60.0).toFixed(1) + " Hours"
																}
															})()}
														</div>
													</ButtonItem>
												</PanelSectionRow>
										);
									else return undefined

								})
							else return (
									<PanelSectionRow>
										Nothing here!<br/>
										Start a game to save playtimes, you can reset them here
									</PanelSectionRow>
							);
						})()
					}
				</PanelSection>
		);
	}
}