import json
import os
import sqlite3
from pathlib import Path
from typing import Dict

import decky


def remove_c_drive_from_path(path):
	"""Removes 'C:/' from the beginning of a path."""

	if path.startswith("C:/") or path.startswith("C:\\"):
		return path[3:]


class Plugin:

	nsl_egs: Dict[str, Dict[str, any]] | None = None
	nsl_gog: Dict[int, Dict[str, any]] | None = None
	heroic_egs: Dict[str, Dict[str, any]] | None = None
	heroic_gog: Dict[int, Dict[str, any]] | None = None

	async def read_config(self) -> dict:
		with open(os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"), "r") as f:
			return json.load(f)

	async def write_config(self, data: dict) -> None:
		with open(os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"), "w") as f:
			json.dump(data, f, indent="\t")

	async def write_cache(self, data: dict) -> None:
		with open(os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "cache.json"), "w") as f:
			json.dump(data, f, indent="\t")

	async def read_cache(self) -> dict:
		with open(os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "cache.json"), "r") as f:
			return json.load(f)

	async def file_size(self, path: str) -> int:
		if os.path.exists(path):
			return os.path.getsize(path)
		else:
			return 0

	async def file_date(self, path: str) -> int:
		if os.path.exists(path):
			return int(os.path.getctime(path))
		else:
			return 0

	async def directory_size(self, path: str) -> int:
		total_size = 0
		if os.path.exists(path):
			for dirpath, dirnames, filenames in os.walk(path):
				for f in filenames:
					fp = os.path.join(dirpath, f)
					# Skip if it is symbolic link
					if not os.path.islink(fp):
						total_size += os.path.getsize(fp)
		return total_size

	async def nsl_egs_data(self, id: str) -> dict | None:
		if self.nsl_egs is not None and id in self.nsl_egs:
			return self.nsl_egs[id]

	async def nsl_gog_data(self, id: int) -> dict | None:
		if self.nsl_gog is not None and id in self.nsl_gog:
			return self.nsl_gog[id]

	async def heroic_egs_data(self, id: str) -> dict | None:
		if self.heroic_egs is not None and id in self.heroic_egs:
			return self.heroic_egs[id]

	async def heroic_gog_data(self, id: int) -> dict | None:
		if self.heroic_gog is not None and id in self.heroic_gog:
			return self.heroic_gog[id]

	async def init_nsl(self) -> None:
		nsl_prefix: Path | None = None

		if (Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "NonSteamLaunchers").exists():
			nsl_prefix = Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "NonSteamLaunchers" / "pfx" / "drive_c"

		elif (Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "EpicGamesLauncher").exists():
			nsl_prefix = Path(decky.DECKY_USER_HOME) / ".local" / "share" / "Steam" / "steamapps" / "compatdata" / "EpicGamesLauncher" / "pfx" / "drive_c"

		if nsl_prefix is not None:
			egs_data = nsl_prefix / "ProgramData" / "Epic" / "EpicGamesLauncher" / "Data" / "Manifests"
			gog_db = nsl_prefix / "ProgramData" / "GOG.com" / "Galaxy" / "storage" / "galaxy-2.0.db"
			if egs_data.exists():
				self.nsl_egs = {}
				for item in os.listdir(egs_data):
					if item.endswith(".item"):
						with open(egs_data / item) as f:
							item_data: dict = json.load(f)
						app_name: str = item_data["AppName"]
						self.nsl_egs[app_name] = {}
						namespace: str = item_data["CatalogNamespace"]
						install_path: str = (nsl_prefix / Path(
							remove_c_drive_from_path(item_data["InstallLocation"]).replace("\\", "/"))).as_posix()
						install_size: int = item_data["InstallSize"]
						install_date: int = await self.file_date(install_path)
						self.nsl_egs[app_name]["namespace"] = namespace
						self.nsl_egs[app_name]["install_size"] = install_size
						self.nsl_egs[app_name]["install_date"] = install_date
						self.nsl_egs[app_name]["install_path"] = install_path

			if gog_db.exists():
				self.nsl_gog = {}
				connection = sqlite3.connect(gog_db)
				cursor = connection.cursor()
				cursor.execute("SELECT productId, installationPath FROM InstalledBaseProducts")
				entries = cursor.fetchall()
				connection.commit()
				connection.close()
				id: int
				path: str
				for id, path in entries:
					self.nsl_gog[id] = {}
					install_path = (nsl_prefix / Path(remove_c_drive_from_path(path).replace("\\", "/"))).as_posix()
					install_size = await self.directory_size(install_path)
					install_date = await self.file_date(install_path)
					self.nsl_gog[id]["install_size"] = install_size
					self.nsl_gog[id]["install_data"] = install_date
					self.nsl_gog[id]["install_path"] = install_path

	async def init_heroic(self):
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
			self.heroic_egs = {}
			key: str
			value: dict
			for key, value in legendary_data.items():
				with open(legendary_metadata / f"{key}.json") as f:
					metadata: dict = json.load(f)["metadata"]
				self.heroic_egs[key] = {}
				namespace: str = metadata["namespace"]
				install_path: str = value["install_path"]
				install_size: int = value["install_size"]
				install_date: int = await self.file_date(install_path)
				self.heroic_egs[key]["namespace"] = namespace
				self.heroic_egs[key]["install_size"] = install_size
				self.heroic_egs[key]["install_date"] = install_date
				self.heroic_egs[key]["install_path"] = install_path

		if gog is not None:
			gog_installed = gog / "installed.json"
			with open(gog_installed) as f:
				gog_data = json.load(f)["installed"]
			self.heroic_gog = {}
			value: dict
			for value in gog_data:
				id: int = int(value["appName"])
				self.heroic_gog[id] = {}
				install_path = value["install_path"]
				install_size = await self.directory_size(install_path)
				install_date = await self.file_date(install_path)
				self.heroic_gog[id]["install_size"] = install_size
				self.heroic_gog[id]["install_date"] = install_date
				self.heroic_gog[id]["install_path"] = install_path

	async def _main(self) -> None:
		"""
		Load function
		"""
		decky.logger.info("Starting MetaDeck")
		await self.init_nsl()
		await self.init_heroic()

	async def _unload(self) -> None:
		"""
		Unload function
		"""
		decky.logger.info("Stopping MetaDeck")

	# await Plugin.commit(self)
	async def _migration(self):
		decky.migrate_settings(
			os.path.join(decky.DECKY_HOME, "settings", "metadeck.json"))
		if os.path.exists(os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "metadeck.json")):
			os.rename(os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "metadeck.json"),
					os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"))

# async def get_metadata_for_key(self, key: int) -> Dict[str, Any] | None:
# 	"""
# 	Waits until metadata is loaded, then returns the metadata
#
# 	:return: The metadata
# 	"""
# 	while Plugin.metadata is None:
# 		await asyncio.sleep(0.1)
# 	assert Plugin.metadata is not None
# 	logger.debug(f"Got metadata for key {key}: {Plugin.metadata[str(key)]}")
# 	return Plugin.metadata[str(key)]
#
# async def set_metadata_for_key(self, key: int, metadata: Dict[str, Any]):
# 	logger.debug(f"Metadata for key {key}: {metadata}")
# 	while Plugin.metadata is None:
# 		await asyncio.sleep(0.1)
# 	assert Plugin.metadata is not None
# 	if not metadata:
# 		Plugin.metadata.pop(str(key), None)
# 	else:
# 		Plugin.metadata[str(key)] = metadata
# 	logger.debug(f"Setting metadata for key {key}: {Plugin.metadata.get(str(key))}")
# 	await Plugin.set_setting(self, "metadata", Plugin.metadata)
#
# async def clear_metadata(self):
# 	Plugin.metadata = {}
# 	await Plugin.set_setting(self, "metadata", Plugin.metadata)
#
# async def get_metadata_keys(self) -> List[int] | None:
# 	while Plugin.metadata is None:
# 		await asyncio.sleep(0.1)
# 	assert Plugin.metadata is not None
# 	logger.debug(f"Got metadata keys {list(map(int, Plugin.metadata.keys()))}")
# 	return list(map(int, Plugin.metadata.keys()))
#
# async def get_metadata_id(self) -> Dict[int, int] | None:
# 	"""
# 	Waits until metadata is loaded, then returns the user's custom ids
#
# 	:return: The metadata
# 	"""
# 	while Plugin.metadata_id is None:
# 		await asyncio.sleep(0.1)
# 	logger.debug(f"Got metadata id {Plugin.metadata_id}")
# 	return Plugin.metadata_id
#
# async def set_metadata_id(self, metadata_id: Dict[int, int]):
# 	Plugin.metadata_id = metadata_id
# 	await Plugin.set_setting(self, "metadata_id", Plugin.metadata_id)
#
# async def get_metadata_id(self) -> Dict[int, int] | None:
# 	"""
# 	Waits until metadata is loaded, then returns the user's custom ids
#
# 	:return: The metadata
# 	"""
# 	while Plugin.metadata_id is None:
# 		await asyncio.sleep(0.1)
# 	logger.debug(f"Got metadata id {Plugin.metadata_id}")
# 	return Plugin.metadata_id
#
# async def set_metadata_id(self, metadata_id: Dict[int, int]):
# 	Plugin.metadata_id = metadata_id
# 	await Plugin.set_setting(self, "metadata_id", Plugin.metadata_id)
#
# async def get_language(self) -> str | None:
# 	while Plugin.language is None:
# 		await asyncio.sleep(0.1)
# 	return Plugin.language
#
# async def set_language(self, language: str):
# 	Plugin.language = language
# 	await Plugin.set_setting(self, "language", Plugin.language)

# async def read(self) -> None:
# 	"""
# 	Reads the json from disk
# 	"""
# 	Plugin.settings.read()
# 	Plugin.language = await Plugin.get_setting(self, "language", "en")
# 	Plugin.metadata = await Plugin.get_setting(self, "metadata", {})
# 	Plugin.metadata_id = await Plugin.get_setting(self, "metadata_id", {})
#
# async def commit(self) -> None:
# 	"""
# 	Commits the json to disk
# 	"""
# 	Plugin.settings.commit()
# 	await Plugin.set_setting(self, "language", Plugin.language)
# 	await Plugin.set_setting(self, "metadata", Plugin.metadata)
# 	await Plugin.set_setting(self, "metadata_id", Plugin.metadata_id)
#
# T = TypeVar("T")
#
# async def get_setting(self, key, default: T) -> T:
# 	"""
# 	Gets the specified setting from the json
#
# 	:param key: The key to get
# 	:param default: The default value
# 	:return: The value, or default if not found
# 	"""
# 	return Plugin.settings.getSetting(key, default)
#
# async def set_setting(self, key, value: T) -> T:
# 	"""
# 	Sets the specified setting in the json
#
# 	:param key: The key to set
# 	:param value: The value to set it to
# 	:return: The new value
# 	"""
# 	Plugin.settings.setSetting(key, value)
# 	return value
