import json
import os
from pathlib import Path
from typing import Dict

import decky
from metadeck.Utils import directory_size, file_date

class Heroic:
	heroic_egs: Dict[str, Dict[str, any]] | None = None
	heroic_gog: Dict[int, Dict[str, any]] | None = None

	@classmethod
	async def init_heroic(cls):
		legendary: Path | None = None
		gog: Path | None = None

		legendary_native = Path(decky.DECKY_USER_HOME) / ".config" / "heroic" / "legendaryConfig" / "legendary"
		legendary_flatpak = Path(decky.DECKY_USER_HOME) / ".var" / "app" / "com.heroicgameslauncher.hgl" / "config" / "heroic" / "legendaryConfig" / "legendary"
		gog_native = Path(decky.DECKY_USER_HOME) / ".config" / "heroic" / "gog_store"
		gog_flatpak = Path(decky.DECKY_USER_HOME) / ".var" / "app" / "com.heroicgameslauncher.hgl" / "config" / "heroic" / "gog_store"

		if legendary_native.exists():
			legendary = legendary_native
		elif legendary_flatpak.exists():
			legendary = legendary_flatpak

		if gog_native.exists():
			gog = gog_native
		elif gog_flatpak.exists():
			gog = gog_flatpak

		if legendary is not None:
			legendary_installed = legendary / "installed.json"
			legendary_metadata = legendary / "metadata"
			with open(legendary_installed) as f:
				legendary_data: dict = json.load(f)
			cls.heroic_egs = {}
			key: str
			value: dict
			for key, value in legendary_data.items():
				if os.path.exists(legendary_metadata / f"{key}.json"):
					with open(legendary_metadata / f"{key}.json") as f:
						metadata: dict = json.load(f)["metadata"]
					cls.heroic_egs[key] = {}
					namespace: str = metadata["namespace"]
					install_path: str = value["install_path"]
					install_size: int = value["install_size"]
					install_date: int = await file_date(install_path)
					cls.heroic_egs[key]["namespace"] = namespace
					cls.heroic_egs[key]["install_size"] = install_size
					cls.heroic_egs[key]["install_date"] = install_date
					cls.heroic_egs[key]["install_path"] = install_path

		if gog is not None:
			gog_installed = gog / "installed.json"
			with open(gog_installed) as f:
				gog_data = json.load(f)["installed"]
			cls.heroic_gog = {}
			value: dict
			for value in gog_data:
				id: int = int(value["appName"])
				cls.heroic_gog[id] = {}
				install_path = value["install_path"]
				install_size = await directory_size(install_path)
				install_date = await file_date(install_path)
				cls.heroic_gog[id]["install_size"] = install_size
				cls.heroic_gog[id]["install_date"] = install_date
				cls.heroic_gog[id]["install_path"] = install_path