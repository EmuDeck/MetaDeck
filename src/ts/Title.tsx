import {Component, ReactNode} from "react";
import {staticClasses} from "decky-frontend-lib";

export class Title extends Component<{ children: ReactNode }>
{
	render()
	{
		return <div className={staticClasses.Title}>
			{
				this.props.children
			}
		</div>;
	}
}