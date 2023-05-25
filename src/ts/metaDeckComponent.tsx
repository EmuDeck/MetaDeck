import {ButtonItem, PanelSection, PanelSectionRow, ProgressBarWithInfo, SteamSpinner} from "decky-frontend-lib";
import {useMetaDeckState} from "./hooks/metadataContext";
import {VFC} from "react";
import {useTranslations} from "./useTranslations";
import {FaSync} from "react-icons/all";

export const MetaDeckComponent: VFC = () =>
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
							nProgress={loadingData.percentage}
							label={t("loading")}
							description={`${loadingData.processed}/${loadingData.total}`}
							sOperationText={loadingData.currentGame}
					/>
				</PanelSectionRow>
			</PanelSection> :
			<PanelSection>
				<PanelSectionRow>
					<ButtonItem onClick={() =>
					{
						metadataManager.clearCache()
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