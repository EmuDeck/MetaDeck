import json
import os
import sqlite3
from pathlib import Path
from typing import Dict

import decky
from metadeck.Utils import directory_size, file_date


def remove_c_drive_from_path(path):
	"""Removes 'C:/' from the beginning of a path."""

	if path.startswith("C:/") or path.startswith("C:\\"):
		return path[3:]

class NSL:
	egs: Dict[str, Dict[str, any]] | None = None
	gog: Dict[int, Dict[str, any]] | None = None

	@classmethod
	async def init_nsl(cls) -> None:
		nsl_prefix: Path | None = None

		if (Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "NonSteamLaunchers").exists():
			nsl_prefix = Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "NonSteamLaunchers" / "pfx" / "drive_c"

		elif (Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "EpicGamesLauncher").exists():
			nsl_prefix = Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "EpicGamesLauncher" / "pfx" / "drive_c"

		if nsl_prefix is not None:
			egs_data = nsl_prefix / "ProgramData" / "Epic" / "EpicGamesLauncher" / "Data" / "Manifests"
			gog_db = nsl_prefix / "ProgramData" / "GOG.com" / "Galaxy" / "storage" / "galaxy-2.0.db"
			if egs_data.exists():
				cls.egs = {}
				for item in os.listdir(egs_data):
					if item.endswith(".item"):
						with open(egs_data / item) as f:
							item_data: dict = json.load(f)
						app_name: str = item_data["AppName"]
						cls.egs[app_name] = {}
						namespace: str = item_data["CatalogNamespace"]
						install_path: str = (nsl_prefix / Path(
							remove_c_drive_from_path(item_data["InstallLocation"]).replace("\\", "/"))).as_posix()
						install_size: int = item_data["InstallSize"]
						install_date: int = await file_date(install_path)
						cls.egs[app_name]["namespace"] = namespace
						cls.egs[app_name]["install_size"] = install_size
						cls.egs[app_name]["install_date"] = install_date
						cls.egs[app_name]["install_path"] = install_path

			if gog_db.exists():
				cls.gog = {}
				connection = sqlite3.connect(gog_db)
				cursor = connection.cursor()
				cursor.execute("SELECT productId, installationPath FROM InstalledBaseProducts")
				entries = cursor.fetchall()
				connection.commit()
				connection.close()
				id: int
				path: str
				for id, path in entries:
					cls.gog[id] = {}
					install_path = (nsl_prefix / Path(remove_c_drive_from_path(path).replace("\\", "/"))).as_posix()
					install_size = await directory_size(install_path)
					install_date = await file_date(install_path)
					cls.gog[id]["install_size"] = install_size
					cls.gog[id]["install_data"] = install_date
					cls.gog[id]["install_path"] = install_path