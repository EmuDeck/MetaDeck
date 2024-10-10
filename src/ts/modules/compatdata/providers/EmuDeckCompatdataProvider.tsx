import {ProviderCache, ProviderConfig} from "../../provider";
import {CompatdataProvider} from "../CompatdataProvider";
import {CompatdataData, SteamDeckCompatCategory, VerifiedDBResults, YesNo} from "../../../Interfaces";
import {FC} from "react";
import {closestWithLimit} from "../../../util";
import {fetchNoCors} from "@decky/api";
import {t} from "../../../useTranslations";
import {isEmulatedGame} from "../../../retroachievements";

export interface EmuDeckCompatdataProviderConfig extends ProviderConfig
{
	fuzziness: number
}

export interface EmuDeckCompatdataProviderCache extends ProviderCache
{

}

export class EmuDeckCompatdataProvider extends CompatdataProvider
{
	static identifier: string = "emudeck";
	static title: string = t("providerCompatdataEmuDeck");
	identifier: string = EmuDeckCompatdataProvider.identifier;
	title: string = EmuDeckCompatdataProvider.title;

	private verifiedDB: Record<string, VerifiedDBResults> = {};

	async getVerifiedDB(): Promise<void>
	{
		const response = (await fetchNoCors("https://opensheet.elk.sh/1fRqvAh_wW8Ho_8i966CCSBgPJ2R_SuDFIvvKsQCv05w/Database"));
		if (response.ok)
		{
			if (response.status === 200)
			{
				const verifiedDB: VerifiedDBResults[] = await response.json()
				this.verifiedDB = verifiedDB.reduce<Record<string, VerifiedDBResults>>((acc, curr) => {
					acc[curr.Game] = curr;
					return acc;
				}, {})
			}
		}
	}

	async mount(): Promise<void>
	{
		await this.getVerifiedDB();
	}

	async provide(appId: number): Promise<CompatdataData | undefined>
	{
		return await this.throttle(async () => {
			const overview = appStore.GetAppOverviewByAppID(appId);
			const key = closestWithLimit(5, overview.display_name ?? "", Object.keys(this.verifiedDB))
			const compatCategoryResult: VerifiedDBResults | undefined = key ? this.verifiedDB[key] : undefined;

			let compatCategory = SteamDeckCompatCategory.UNKNOWN
			if (compatCategoryResult)
			{
				if (compatCategoryResult.Boots == YesNo.YES && compatCategoryResult.Playable == YesNo.YES)
					compatCategory = SteamDeckCompatCategory.VERIFIED
				else if (compatCategoryResult.Boots == YesNo.YES && (compatCategoryResult.Playable == YesNo.NO || compatCategoryResult.Playable == YesNo.PARTIAL))
					compatCategory = SteamDeckCompatCategory.PLAYABLE
				else
					compatCategory = SteamDeckCompatCategory.UNSUPPORTED
			}

			this.module.logger.debug("throttle")

			return {
				compat_category: compatCategory,
				compat_notes: compatCategoryResult?.Notes
			}
		});
	}

	async test(appId: number): Promise<boolean>
	{
		return await isEmulatedGame(appId);
	}

	settingsComponent(): FC
	{
		return () => undefined;
	}

}