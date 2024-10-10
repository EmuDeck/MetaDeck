import {useState} from "react";
import languages from "./translations";

function getCurrentLanguage(): keyof typeof languages {
	const steamLang = window.LocalizationManager.m_rgLocalesToUse[0]
	const lang = steamLang.replace(/-([a-z])/g, (_, letter: string) =>
			letter.toUpperCase()
	) as keyof typeof languages
	return languages[lang] ? lang : 'en'
}

export function useTranslations() {
	const [lang] = useState(getCurrentLanguage())
	return function (key: keyof (typeof languages)['en']): string {
		let lang2 = lang
		// if (!(key in languages[lang]))
		// {
		// 	lang2 = "en"
		// }
		// @ts-ignore
		if (languages[lang2]?.[key]?.length) {
			// @ts-ignore
			return languages[lang2]?.[key]
		} else if (languages.en?.[key]?.length) {
			return languages.en?.[key]
		} else {
			return key
		}
	}
}

export function t(key: keyof (typeof languages)['en']): string {
	let lang = getCurrentLanguage()
	// if (!(key in languages[lang]))
	// {
	// 	lang = "en"
	// }
	// @ts-ignore
	if (languages[lang]?.[key]?.length) {
		// @ts-ignore
		return languages[lang]?.[key]
	} else if (languages.en?.[key]?.length) {
		return languages.en?.[key]
	} else {
		return key
	}
}

export function format(fmt: string, ...args: any[]){
	return fmt
			.split("%%")
			.reduce((aggregate, chunk, i) =>
					aggregate + chunk + (args[i] || ""), "");
}