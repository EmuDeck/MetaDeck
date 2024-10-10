import {FC, useState} from "react";
import {
	ButtonItem,
	Navigation,
	PanelSection,
	PanelSectionRow, ToggleField
} from "@decky/ui";
import {Module} from "./module";
import {Provider} from "./provider";
import {useMetaDeckState} from "../hooks/metadataContext";
import {format, t} from "../useTranslations";

export interface ModuleSettingsProps
{
	module: Module<any, any, any, any, any, any, any, any, any>,
	providers: Provider<any, any, any, any, any, any, any, any, any>[]
}

export const ModuleSettingsComponent: FC<ModuleSettingsProps> = ({module}) => {
	const {modules} = useMetaDeckState()
	const ModuleSettings = module.settingsComponent()

	const [enabled, setEnabled] = useState(module.enabled)

	const disabled = module.dependencies.map((key) => modules[key]).some(mod => !mod.isValid)

	const missing = module.dependencies.map((key) => modules[key])
		   .filter((mod) => !mod.isValid )
		   .map((mod) => mod.title)

	return (
		   <PanelSection title={format(t("settingsModule"), module.title)}>
			   <PanelSectionRow>
				   <ToggleField
						 label={t("settingsEnabled")}
						 checked={enabled}
						 onChange={(checked) => {
							 setEnabled(checked);
							 module.enabled = checked;
							 for (let mod of Object.values(modules))
							 {
								 mod.unmetDependency = mod.dependencies.map((key) => modules[key]).some((mod2) => !mod2.isValid)
							 }
						 }}
						 description={disabled ?
							    format(t("settingsDependencyNotMet"), module.title, missing.join(", "))
							    : t("settingsEnabledDesc")}
						 disabled={disabled}
				   />
			   </PanelSectionRow>
			   <ModuleSettings/>
			   <PanelSectionRow>
				   <ButtonItem
						 label={format(t("settingsModuleProvider"), module.title)}
						 layout={"inline"}
						 children={t("settingsProvider")}
						 onClick={() => Navigation.Navigate(`/metadeck/${module.identifier}`)}
				   />
			   </PanelSectionRow>
		   </PanelSection>
	)
}