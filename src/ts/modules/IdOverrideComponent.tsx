import {Fragment, ReactNode, useEffect, useState} from "react";
import {
	DialogButton, Dropdown,
	DropdownOption, Field, Focusable, SteamSpinner
} from "@decky/ui";
import {useMetaDeckState} from "../MetaDeckState";
import {FaPlus, FaTrash} from "react-icons/fa";
import {IDDictionary} from "../Interfaces";
import {t} from "../useTranslations";

export interface IdOverrideProps<T extends number | string>
{
	value: IDDictionary,
	resultsForApp: (appId: number) => Promise<Record<number, Entry<T>>>,
	onChange: (overrides: IDDictionary) => void
}

export interface Entry<T extends number | string>
{
	label: ReactNode,
	title: ReactNode,
	id: T,
	appId: number
}

function objectMap<K extends string | number | symbol, V, T>(object: Record<K, V>, mapFn: (key: K, value: V) => T)
{
	return Object.keys(object).reduce((result, key) => {
		result[key as K] = mapFn(key as K, object[key as K])
		return result
	}, {} as Record<K, T>);
}


export const IdOverrideComponent = <T extends number | string>({
													   resultsForApp,
													   onChange,
													   value
												   }: IdOverrideProps<T>) => {
	const {apps, modules} = useMetaDeckState();
	const [app, setApp] = useState<number>();
	const [id, setId] = useState<Entry<T>>();
	const [appOptions, setAppOptions] = useState<DropdownOption[]>([]);
	const [idOptions, setIdOptions] = useState<DropdownOption[]>([]);
	const [entries, setEntries] = useState<Record<number, Entry<T>>>({});
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		(async () => {
			setLoaded(false)
			const ret: Record<number, Entry<T>> = {};
			for (const [key, val] of Object.entries(value))
			{
				if (val === 0 || val === "")
					ret[+key] = {
						label: appStore.GetAppOverviewByAppID(+key).display_name,
						title: "None",
						id: 0 as T,
						appId: +key
					};
				else ret[+key] = (await resultsForApp(+key))[+val];
			}
			setEntries(ret);
			setLoaded(true);
			modules.metadata.logger.debug("Loaded", ret)
		})()
	}, [value]);

	useEffect(() => {

			setAppOptions(apps.filter((id) => !Object.values(entries).some((value) => value.appId == id))
				   .map((value) => ({
					   label: appStore.GetAppOverviewByAppID(value).display_name,
					   data: value
				   }))
			)
	}, [entries])

	useEffect(() => {
		(async () => {
			setIdOptions(!!app ? Object.values(await resultsForApp(app)).map((value) => ({
				label: `${value.title} (${value.id})`,
				data: value
			})).concat({
				label: "None (0)",
				data: {
					label: appStore.GetAppOverviewByAppID(app).display_name,
					title: "None",
					id: 0 as T,
					appId: app
				}
			}) : [])
		})()
	}, [app]);

	return <Fragment>
		<Field
			   label={t("settingsOverrides")}
			   description={t("settingsOverridesDesc")}
			   childrenLayout={"below"}
			   bottomSeparator={"thick"}
		>
			<Focusable
				   style={{
					   display: "flex",
					   marginLeft: "auto",
					   height: "40px"
				   }}
			>
				<div style={{height: '40px', minWidth: '60px', marginRight: '10px', flexGrow: "2"}}>
					<Dropdown
						   rgOptions={appOptions}
						   selectedOption={app}
						   onChange={(value) => {
							   setApp(value.data)
							   setId(undefined)
						   }}
					/>
				</div>
				<div style={{height: '40px', minWidth: '60px', marginRight: '10px', flexGrow: "2"}}>
					<Dropdown
						   rgOptions={idOptions}
						   selectedOption={id}
						   onChange={(value) => {
							   setId(value.data)
						   }}
					/>
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
						   if (!!id)
						   {
							   const obj = (entries)
							   obj[id.appId] = id
							   onChange(objectMap(entries, (_, value) => value.id))
						   }
					   }}
				>
					<FaPlus/>
				</DialogButton>
			</Focusable>
		</Field>

		{loaded ? <Fragment>
			{
				Object.values(entries).map((entry) =>

					   <Field
							 label={entry.label}
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

								   {`${entry.title} (${entry.id})`}
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
										 const obj = (entries)
										 delete obj[entry.appId]
										 onChange(objectMap(obj, (_, value) => value.id))
									 }}
							   >
								   <FaTrash/>
							   </DialogButton>
						   </Focusable>
					   </Field>
				)
			}
		</Fragment> : <SteamSpinner/>}

	</Fragment>
}