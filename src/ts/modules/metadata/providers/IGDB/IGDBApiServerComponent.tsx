import {FC, Fragment, useEffect, useState} from "react";
import {APIServer} from "./IGDBMetadataProvider";
import {DialogButton, Dropdown, DropdownOption, Field, Focusable, TextField} from "@decky/ui";
import {FaPlus, FaTrash} from "react-icons/fa";
import {fetchNoCors} from "@decky/api";

export const IGDBApiServerComponent: FC<{
	server: APIServer | undefined,
	customServers: APIServer[],
	onServerChange: (server: APIServer | undefined) => void,
	onCustomServersChange: (servers: APIServer[]) => void,
}> = ({server, customServers, onServerChange, onCustomServersChange}) => {
	const [serverOptions, setServerOptions] = useState<DropdownOption[]>([])

	const [name, setName] = useState<string>("")
	const [url, setUrl] = useState<string>("")

	useEffect(() => {
		(async () => {
			setServerOptions(Object.entries(await (await fetchNoCors("https://raw.githubusercontent.com/EmuDeck/MetaDeck/refs/heads/main/api_servers.json")).json() as Record<string, string>)
				   .map(([name, url]) => ({name, url} as APIServer))
				   .concat(customServers)
				   .map((server) => ({
					   label: `${server.name} (${server.url})`,
					   data: server
				   } as DropdownOption)))
		})()
	}, [customServers]);

	return <Fragment>
		<Field
			   label={"API Server"}
			   description={"Sets the API server that requests are sent through"}
			   childrenLayout={"below"}
			   bottomSeparator={"thick"}
		>
			<Dropdown
				   rgOptions={serverOptions}
				   selectedOption={server}
				   onChange={(value) => {
					   onServerChange(value.data)
				   }}
				   renderButtonValue={() => (server?.name ?? "")}
			/>
		</Field>
		<Field
			   label={"Custom API Servers"}
			   description={"Add custom API servers not on the official list, or that are run locally"}
			   childrenLayout={"below"}
			   bottomSeparator={"thick"}
		>
			<Focusable
				   style={{
					   display: "flex",
					   marginLeft: "auto",
					   height: "66px"
				   }}
			>
				<div style={{height: '66px', minWidth: '60px', marginRight: '10px', flexGrow: "2"}}>
					<TextField
						   label={"Name"}
						   value={name}
						   onChange={(e) => (setName(e.target.value))}
					/>
				</div>
				<div style={{height: '66px', minWidth: '60px', marginRight: '10px', flexGrow: "2"}}>
					<TextField
						   label={"Url"}
						   value={url}
						   onChange={(e) => (setUrl(e.target.value))}
					/>
				</div>
				<DialogButton
					   style={{
						   height: '40px',
						   width: '40px',
						   marginTop: '24px',
						   padding: '10px 12px',
						   minWidth: '40px',
						   display: 'flex',
						   flexDirection: 'column',
						   justifyContent: 'center',
					   }}
					   onClick={() => {
						   onCustomServersChange(customServers.concat([{name, url}]))
					   }}
				>
					<FaPlus/>
				</DialogButton>
			</Focusable>
		</Field>
		{
			customServers.map((customServer) =>
				   <Field
						 label={customServer.name}
						 childrenLayout={"inline"}
						 bottomSeparator={"standard"}
				   >
					   <Focusable
							 style={{
								 display: "flex",
								 marginLeft: "auto",
								 height: "40px",
								 alignItems: "center"
							 }}
					   >
						   <div style={{
							   height: '40px',
							   minWidth: '60px',
							   marginRight: '10px',
							   flexGrow: "2"
						   }}>
							   {customServer.url}
						   </div>
						   <DialogButton
								 style={{
									 height: '40px',
									 width: '40px',
									 padding: '10px 12px',
									 minWidth: '40px',
									 display: 'flex',
									 flexDirection: 'column',
									 justifyContent: 'center',
								 }}
								 onClick={() => {
									 if (server === customServer) onServerChange(undefined)
									 onCustomServersChange(customServers.filter((value) => value !== customServer))
								 }}
						   >
							   <FaTrash/>
						   </DialogButton>
					   </Focusable>
				   </Field>
			)
		}
	</Fragment>
}