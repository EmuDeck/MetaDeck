import logging
from typing import TypeVar

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
		pass

	async def read(self) -> None:
		"""
		Reads the json from disk
		"""
		Plugin.settings.read()

	async def commit(self) -> None:
		"""
		Commits the json to disk
		"""
		Plugin.settings.commit()

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
