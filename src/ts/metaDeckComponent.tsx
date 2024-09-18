import {useMetaDeckState} from "./hooks/metadataContext";
import {FC} from "react";
import {useTranslations} from "./useTranslations";
import {ButtonItem, PanelSection, PanelSectionRow, ProgressBarWithInfo, SteamSpinner} from "@decky/ui";
import {FaSync} from "react-icons/fa";

export const MetaDeckComponent: FC = () =>
{
	const t = useTranslations()
	const {managers: {metadataManager}, loadingData, refresh} = useMetaDeckState()
	return (loadingData.globalLoading ?
			<PanelSection>
				<PanelSectionRow>
					<SteamSpinner/>
				</PanelSectionRow>
				<PanelSectionRow>
					<ProgressBarWithInfo
							label={t("loading")}
							layout="inline"
							bottomSeparator="none"
							sOperationText={loadingData.game}
							description={loadingData.description}
							nProgress={loadingData.percentage}
							sTimeRemaining={<div style={{
								paddingRight: "10px"
							}}>{!loadingData.fetching ? `${loadingData.processed}/${loadingData.total}` : ""}</div>}
							indeterminate={loadingData.fetching}
					/>
				</PanelSectionRow>
			</PanelSection> :
			<PanelSection>
				<PanelSectionRow>
					<ButtonItem onClick={() =>
					{
						void metadataManager.clearCache();
					}}>
						Clear Cache
					</ButtonItem>
				</PanelSectionRow>
				<PanelSectionRow>
					<ButtonItem
							onClick={() => void refresh()}
					><FaSync/> {t("refresh")}</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
	);
}