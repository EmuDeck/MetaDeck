import asyncio
import json
import logging
import os
import pathlib
import subprocess
import sys

import decky


class Plugin:
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
		for dirpath, dirnames, filenames in os.walk(path):
			for f in filenames:
				fp = os.path.join(dirpath, f)
				# Skip if it is symbolic link
				if not os.path.islink(fp):
					total_size += os.path.getsize(fp)
		return total_size

	async def _main(self) -> None:
		"""
		Load function
		"""
		if not os.path.exists(os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")):
			with open(os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"), "w") as f:
				json.dump({
					"metadata_id": {},
					"metadata_custom": {}
				}, f, indent="\t")
		if not os.path.exists(os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "cache.json")):
			with open(os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "cache.json"), "w") as f:
				json.dump({
					"metadata": {}
				}, f, indent="\t")
		decky.logger.info("Starting MetaDeck")

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
