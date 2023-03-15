import {Component} from "react";
import {AppProps} from "./Interfaces";
import {ButtonItem, PanelSection, PanelSectionRow} from "decky-frontend-lib";

export class App extends Component<AppProps, {}>
{
	render()
	{
		return (
				<PanelSection>
					<PanelSectionRow>
						<ButtonItem onClick={() =>
						{
							this.props.metadataManager().clearCache()
						}}>
							Clear Cache
						</ButtonItem>
					</PanelSectionRow>
				</PanelSection>
		);
	}
}