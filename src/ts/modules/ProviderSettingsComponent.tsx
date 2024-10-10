import {FC, useState} from "react";
import {
	PanelSection,
	PanelSectionRow,
	SidebarNavigation,
	SidebarNavigationPage,
	ToggleField,
	useParams
} from "@decky/ui";
import {useMetaDeckState} from "../hooks/metadataContext";
import {format, t} from "../useTranslations";

export const ProviderSettingsComponent: FC = () => {
	const state = useMetaDeckState();
	const {module} = useParams<{ module: string }>();
	const pages: SidebarNavigationPage[] = [];

	for (let provider of state.modules[module].providers)
	{
		const [enabled, setEnabled] = useState(provider.enabled)
		const ProviderSettings = provider.settingsComponent();
		pages.push({
			title: provider.title,
			content: (
				   <PanelSection title={format(t("settingsModule"), provider.title)}>
					   <PanelSectionRow>
						   <ToggleField
								 label={t("settingsEnabled")}
								 description={t("settingsEnabledDesc")}
								 checked={enabled} onChange={(checked) => {
							   setEnabled(checked);
							   provider.enabled = checked;
						   }}/>
					   </PanelSectionRow>
					   <ProviderSettings/>
				   </PanelSection>
			)
		})
	}
	if (pages.length > 0)
		return <SidebarNavigation pages={pages} />
	else
		return undefined
}