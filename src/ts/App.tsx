import {Component} from "react";
import {AppProps} from "./Interfaces";

export class App extends Component<AppProps, {}>
{
	loadState()
	{
	}

	componentDidMount()
	{
		this.loadState()
	}

	render()
	{
		return (
				<div/>
		);
	}
}