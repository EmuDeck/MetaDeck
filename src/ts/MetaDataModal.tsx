import {Fragment, useEffect, useState, VFC} from "react";
import {ConfirmModal, DropdownItem, SteamSpinner} from "decky-frontend-lib";
import {MetadataManager} from "./MetadataManager";
import {MetadataData} from "./Interfaces";
import {useTranslations} from "./useTranslations";


export const MetaDataModal: VFC<{ appId: number, manager: MetadataManager, closeModal: () => void }> = ({
	                                                                                                        appId,
	                                                                                                        manager,
	                                                                                                        closeModal
                                                                                                        }) =>
{
	const [metadata, setMetadata] = useState<{ [p: number]: MetadataData } | undefined>();
	const [metadataId, setMetadataId] = useState<number>(0);
	const [selected, setSelected] = useState<MetadataData | undefined>();
	const [loaded, setLoaded] = useState<boolean>(false);
	const t = useTranslations()

	useEffect(() =>
	{
		if (appId!==0 && metadata===undefined)
		{
			manager.getAllMetadataForGame(appId).then(data =>
			{
				setMetadata(data);
				if (selected===undefined)
				{
					manager.getMetadataId(appId).then(id =>
					{
						setSelected(!!data && !!id ? data[id] : undefined);
						setMetadataId(id ?? 0);
						setLoaded(true);
					});
				}
			})
		}
	});

	if (appId===0) return null;

	return (
			<Fragment>
				<ConfirmModal
						strTitle={t("changeMetadata")}
						onOK={async () =>
						{
							await manager.setMetadataId(appId, metadataId)
							closeModal();
						}}
						closeModal={closeModal}
				>
					{
						loaded ? <Fragment>
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
							<div>
								{selected?.description}
							</div>
						</Fragment>:<SteamSpinner/>
					}
				</ConfirmModal>
			</Fragment>
	);
};