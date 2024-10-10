
// export const ChangeMetadataComponent: FC<{ manager: MetadataManager }> = ({manager}) => {
// 	const {appid} = useParams<{ appid: string }>()
// 	const app_id = +appid;
// 	const [metadata, setMetadata] = useState<{ [p: number]: MetadataData } | undefined>();
// 	const [metadataId, setMetadataId] = useState<number>(0);
// 	const [metadataCustom, setMetadataCustom] = useState<boolean>(manager.metadata_custom[app_id]);
// 	const [markdown, setMarkdown] = useState("")
// 	const [selected, setSelected] = useState<MetadataData | undefined>();
// 	const [loaded, setLoaded] = useState<boolean>(false);
// 	const t = useTranslations()
//
// 	useEffect(() => {
// 		(async () => {
// 			if (app_id !== 0 && metadata === undefined)
// 			{
// 				const data = await manager.getAllMetadataForGame(app_id)
// 				setMetadata(data);
// 				if (selected === undefined)
// 				{
// 					if (manager.metadata_custom[app_id])
// 						setSelected(manager.metadata[app_id])
// 					else
// 					{
// 						const id = await manager.getMetadataId(app_id)
// 						setSelected(!!data && !!id ? data[id] : undefined);
// 						setMetadataId(id ?? 0);
// 					}
// 					setLoaded(true);
// 				}
// 			}
// 		})()
// 	});
//
// 	if (app_id === 0) return null;
// 	return (
// 		   <div style={{
// 			   marginTop: '40px',
// 			   height: 'calc( 100% - 40px )',
// 		   }}>
// 			   <PanelSection title={t("changeMetadata")}>
// 				   {loaded ?
// 						 <Fragment>
// 							 <DropdownItem rgOptions={
// 								 metadata ? [...Object.values(metadata).map(value => {
// 												  return {
// 													  label: `${value.title} (${value.id})`,
// 													  options: undefined,
// 													  data: value
// 												  }
// 											  }
// 									    ),
// 										    {
// 											    label: "None (0)",
// 											    options: undefined,
// 											    data: undefined
// 										    },
// 										    {
// 											    label: "Custom",
// 											    options: undefined,
// 											    data: manager.metadata[app_id]
// 										    }] :
// 									    [{
// 										    label: "None (0)",
// 										    options: undefined,
// 										    data: undefined
// 									    },
// 										    {
// 											    label: "Custom",
// 											    options: undefined,
// 											    data: manager.metadata[app_id]
// 										    }]
// 							 } selectedOption={selected}
// 										onChange={data => {
// 											setSelected(data.data)
// 											if ((data.label as string) === "Custom")
// 											{
// 												setMetadataCustom(true)
// 												setMarkdown(selected?.description ?? "")
// 											} else
// 											{
// 												setMetadataCustom(false)
// 												setMetadataId(data.data?.id ?? 0)
// 											}
// 										}}/>
//
// 							 {selected?.title && selected?.description ? <Fragment>
// 								 <Markdown>{`
// # ${selected.title}
// `}
// 								 </Markdown>
// 								 {metadataCustom ? <MDXEditor markdown={markdown} onChange={setMarkdown}/> :
// 									    <Markdown>{selected.description}</Markdown>}
// 								 <Markdown>{`
//
// **Developers:** [${(selected.developers ?? []).map((developer) => developer.name).join(', ')}]
//
// **Publishers:** [${(selected.publishers ?? []).map((publisher) => publisher.name).join(', ')}]
//
// **Release Date:** ${(() => {
// 									 if (selected.release_date)
// 									 {
// 										 const release_date = new Date(0);
// 										 release_date.setUTCSeconds(selected.release_date);
// 										 return release_date.toLocaleDateString("en", {dateStyle: "medium"});
// 									 } else return "";
// 								 })()}
// `}
// 								 </Markdown></Fragment> : null}
// 							 <ButtonItem onClick={async () => {
// 								 manager.metadata_custom[app_id] = metadataCustom
// 								 if (metadataCustom)
// 								 {
// 									 manager.metadata[app_id].description = markdown
//
// 									 await manager.saveData()
// 								 } else
// 									 await manager.setMetadataId(app_id, metadataId)
// 								 Navigation.NavigateBack()
// 							 }}>
// 								 {t("save")}
// 							 </ButtonItem>
// 						 </Fragment> : <SteamSpinner/>
// 				   }
// 			   </PanelSection>
// 		   </div>
// 	);
// }