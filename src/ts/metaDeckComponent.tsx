import {useMetaDeckState} from "./hooks/metadataContext";
import {FC} from "react";
import {useTranslations} from "./useTranslations";
import {ButtonItem, PanelSection, PanelSectionRow, ProgressBarWithInfo} from "@decky/ui";
import {FaSync, FaTrash} from "react-icons/fa";

export const MetaDeckComponent: FC = () =>
{
	const t = useTranslations()
	const { loadingData, refresh, clear } = useMetaDeckState()
	return (loadingData.loading || loadingData.currentModule.error ?
			<PanelSection>
				<PanelSectionRow>
					<ProgressBarWithInfo
							label={t("loading")}
							layout="inline"
							bottomSeparator="none"
							sOperationText={loadingData.currentModule.module.title}
							nProgress={loadingData.percentage}
							sTimeRemaining={<div style={{
								paddingRight: "10px"
							}}>{`${loadingData.processed}/${loadingData.total}`}</div>}
					/>
				</PanelSectionRow>
				<PanelSectionRow>
					<ProgressBarWithInfo
						   label={loadingData.currentModule.module.title}
						   layout="inline"
						   bottomSeparator="none"
						   sOperationText={loadingData.currentModule.error ? `Error: ${loadingData.currentModule.error.name}` : loadingData.currentModule.game}
						   description={loadingData.currentModule.error ? loadingData.currentModule.error.message : loadingData.currentModule.description}
						   nProgress={loadingData.currentModule.percentage}
						   sTimeRemaining={<div style={{
							   paddingRight: "10px"
						   }}>{`${loadingData.currentModule.processed}/${loadingData.currentModule.total}`}</div>}
					/>
				</PanelSectionRow>
			</PanelSection> :
			<PanelSection>
				<PanelSectionRow>
					<ButtonItem
						   onClick={() => void clear()}
					><FaTrash/> {t("clear")}</ButtonItem>
				</PanelSectionRow>
				<PanelSectionRow>
					<ButtonItem
							onClick={() => void refresh()}
					><FaSync/> {t("refresh")}</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
	);
}