import {FC, Fragment, useEffect, useState} from "react";
import {MetadataManager} from "./MetadataManager";
import {MetadataData} from "./Interfaces";
import {useTranslations} from "./useTranslations";
import {Markdown} from "./markdown";
import {ButtonItem, DropdownItem, Navigation, PanelSection, SteamSpinner, useParams} from "@decky/ui";

export const
	   ChangeMetadataComponent: FC<{ manager: MetadataManager }> = ({manager}) =>
{
	const {appid} = useParams<{ appid: string }>()
	const app_id = +appid;
	const [metadata, setMetadata] = useState<{ [p: number]: MetadataData } | undefined>();
	const [metadata_id, setMetadataId] = useState<number>(0);
	const [selected, setSelected] = useState<MetadataData | undefined>();
	const [loaded, setLoaded] = useState<boolean>(false);
	const t = useTranslations()

	useEffect(() =>
	{
		(async () =>
		{
			if (app_id!==0 && metadata===undefined)
			{
				const data = await manager.getAllMetadataForGame(app_id)
				setMetadata(data);
				if (selected===undefined)
				{
					const id = await manager.getMetadataId(app_id)
					setSelected(!!data && !!id ? data[id]:undefined);
					setMetadataId(id ?? 0);
					setLoaded(true);
				}
			}
		})()
	});

	if (app_id===0) return null;
	return (
			<div style={{
				marginTop: '40px',
				height: 'calc( 100% - 40px )',
			}}>
				<PanelSection title={t("changeMetadata")}>
					{loaded ?
							<Fragment>
								<DropdownItem rgOptions={
									metadata ? [...Object.values(metadata).map(value =>
													{
														return {
															label: `${value.title} (${value.id})`,
															options: undefined,
															data: value
														}
													}
											),
												{
													label: `None (0)`,
													options: undefined,
													data: undefined
												}]:
											[{
												label: `None (0)`,
												options: undefined,
												data: undefined
											}]
								} selectedOption={selected}
								              onChange={data =>
								              {
									              setSelected(data.data)
									              setMetadataId(data.data?.id ?? 0)
								              }}/>
								{selected?.title && selected?.description ? <Markdown>
									{`
# ${selected.title}
${selected.description}

**Developers:** [${(selected.developers ?? []).map((developer) => developer.name).join(', ')}]

**Publishers:** [${(selected.publishers ?? []).map((publisher) => publisher.name).join(', ')}]

**Release Date:** ${(() => {
										if (selected.release_date)
										{
											const release_date = new Date(0);
											release_date.setUTCSeconds(selected.release_date);
											return release_date.toLocaleDateString("en", {dateStyle: "medium"});
										}
										else return "";
})()}
`}
								</Markdown>:null}
								<ButtonItem onClick={async () =>
								{
									await manager.setMetadataId(app_id, metadata_id)
									Navigation.NavigateBack()
								}}>
									{t("save")}
								</ButtonItem>
							</Fragment>:<SteamSpinner/>
					}
				</PanelSection>
			</div>
	);
}