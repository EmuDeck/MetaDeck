import {findClassModule, findModuleExport} from "@decky/ui";
import {ComponentClass, FC, PropsWithChildren} from "react";
import {SteamAppOverview} from "../../SteamTypes";
import {CustomStoreCategory, customStoreIcons, customStoreTitles} from "../../Interfaces";
import {t} from "../../useTranslations";

interface TooltipProps extends PropsWithChildren
{
	direction: string,
	className: string,
	toolTipContent: string,
	nDelayShowMS: number,
	bDisabled: boolean
}

const TooltipSource: ComponentClass<TooltipProps> = findModuleExport((e) => e?.toString()?.includes("tool-tip-source"));

export interface CustomFeatureProps
{
	feature: CustomStoreCategory,
	minimode: boolean,
	overview: SteamAppOverview,
	suppresstooltip: boolean
}

type FeatureListClasses = Record<
	   | "Container"
	   | "Icon"
	   | "ExtraMargin"
	   | "Label",
	   string
>

export const featureListClasses = findClassModule((m) => m.ExtraMargin) as FeatureListClasses

export const CustomFeature: FC<CustomFeatureProps> = ({feature, suppresstooltip, minimode, overview}) => {
	const Icon = customStoreIcons[feature]
	const label = t(customStoreTitles[feature])
	if (!overview.BHasStoreCategory(feature))
		return null
	return <TooltipSource
		   direction={"left"}
		   className={featureListClasses.Container}
		   toolTipContent={label}
		   nDelayShowMS={0}
		   bDisabled={suppresstooltip}
	>
		<Icon
			   className={featureListClasses.Icon}
		/>
		{!minimode && <div
			   className={featureListClasses.Label}
		>
			{label}
		</div>}
	</TooltipSource>
}
