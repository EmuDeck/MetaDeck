import asyncio
import logging
from typing import TypeVar, Dict

from settings import SettingsManager

logging.basicConfig(
	filename="/tmp/metadeck.log",
	format='[MetaDeck] %(asctime)s %(levelname)s %(message)s',
	filemode='w+',
	force=True
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)  # can be changed to logging.DEBUG for debugging issues

class Plugin:
	language: str = None
	metadata_id: Dict[int, int] = None
	metadata: Dict[int, Dict[str, any]] = None
	settings: SettingsManager

	async def _main(self) -> None:
		"""
		Load function
		"""
		Plugin.settings = SettingsManager("metadeck")

		await Plugin.read(self)

	async def _unload(self) -> None:
		"""
		Unload function
		"""
		await Plugin.commit(self)

	async def get_metadata(self) -> Dict[int, Dict[str, any]] | None:
		"""
		Waits until metadata is loaded, then returns the tabs

		:return: The metadata
		"""
		while Plugin.metadata is None:
			await asyncio.sleep(0.1)
		logger.debug(f"Got metadata {Plugin.metadata}")
		return Plugin.metadata

	async def set_metadata(self, metadata: Dict[int, Dict[str, any]]):
		Plugin.metadata = metadata
		await Plugin.set_setting(self, "metadata", Plugin.metadata)

	async def get_metadata_id(self) -> Dict[int, int] | None:
		"""
		Waits until metadata is loaded, then returns the tabs

		:return: The metadata
		"""
		while Plugin.metadata_id is None:
			await asyncio.sleep(0.1)
		logger.debug(f"Got metadata id {Plugin.metadata_id}")
		return Plugin.metadata_id

	async def set_metadata_id(self, metadata_id: Dict[int, int]):
		Plugin.metadata_id = metadata_id
		await Plugin.set_setting(self, "metadata_id", Plugin.metadata_id)

	async def get_language(self) -> str | None:
		while Plugin.language is None:
			await asyncio.sleep(0.1)
		return Plugin.language

	async def set_language(self, language: str):
		Plugin.language = language
		await Plugin.set_setting(self, "language", Plugin.language)

	async def read(self) -> None:
		"""
		Reads the json from disk
		"""
		Plugin.settings.read()
		Plugin.language = await Plugin.get_setting(self, "language", "en")
		Plugin.metadata = await Plugin.get_setting(self, "metadata", {})
		Plugin.metadata_id = await Plugin.get_setting(self, "metadata_id", {})

	async def commit(self) -> None:
		"""
		Commits the json to disk
		"""
		Plugin.settings.commit()
		await Plugin.set_setting(self, "language", Plugin.language)
		await Plugin.set_setting(self, "metadata", Plugin.metadata)
		await Plugin.set_setting(self, "metadata_id", Plugin.metadata_id)

	T = TypeVar("T")

	async def get_setting(self, key, default: T) -> T:
		"""
		Gets the specified setting from the json

		:param key: The key to get
		:param default: The default value
		:return: The value, or default if not found
		"""
		return Plugin.settings.getSetting(key, default)

	async def set_setting(self, key, value: T) -> T:
		"""
		Sets the specified setting in the json

		:param key: The key to set
		:param value: The value to set it to
		:return: The new value
		"""
		Plugin.settings.setSetting(key, value)
		return value
