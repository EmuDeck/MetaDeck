import asyncio
import logging
import os
import pathlib
import subprocess

import decky_plugin

logging.basicConfig(
	filename="/tmp/metadeck.log",
	format='[MetaDeck] %(asctime)s %(levelname)s %(message)s',
	filemode='w+',
	force=True
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)  # can be changed to logging.DEBUG for debugging issues

HOME_DIR = str(pathlib.Path(os.getcwd()).parent.parent.resolve())
PARENT_DIR = str(pathlib.Path(__file__).parent.resolve())


class Plugin:
	# language: str = None
	# metadata_id: Dict[int, int] = None
	# metadata: Dict[str, Dict[str, Any]] = None
	# settings: SettingsManager
	# packet_size: int = 1000
	# length: int = 0
	# buffer: str = ""
	backend_proc = None

	# async def start_write_config(self, length, packet_size=1000) -> None:
	# 	Plugin.buffer = ""
	# 	Plugin.length = length
	# 	Plugin.packet_size = packet_size
	#
	# async def write_config(self, index, data) -> None:
	# 	Plugin.buffer += data
	# 	if index >= Plugin.length - 1:
	# 		Plugin.length = 0
	# 		config = json.loads(Plugin.buffer)
	# 		Plugin.buffer = ""
	# 		with open(os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"), "w") as f:
	# 			json.dump(config, f, indent="\t")
	#
	# async def start_read_config(self, packet_size=1000) -> int:
	# 	Plugin.buffer = ""
	# 	Plugin.length = 0
	# 	Plugin.packet_size = packet_size
	# 	with open(os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"), "r") as f:
	# 		config = json.load(f)
	# 		Plugin.buffer = json.dumps(config, indent="\t")
	# 		Plugin.length = math.ceil(len(Plugin.buffer) / float(Plugin.packet_size))
	# 		return Plugin.length
	#
	# async def read_config(self, index) -> str:
	# 	if index < Plugin.length - 1:
	# 		return Plugin.buffer[index * Plugin.packet_size: (index + 1) * Plugin.packet_size]
	# 	else:
	# 		Plugin.length = 0
	# 		config = Plugin.buffer[index * Plugin.packet_size:]
	# 		Plugin.buffer = ""
	# 		return config

	async def _main(self) -> None:
		"""
		Load function
		"""
		# Plugin.settings = SettingsManager("metadeck")

		# await Plugin.read(self)
		# if not os.path.exists(os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")):
		# 	with open(os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"), "w") as f:
		# 		json.dump({
		# 			"metadata_id": {},
		# 			"metadata_custom": {},
		# 			"metadata": {}
		# 		}, f)
		print("MetaDeck starting...")
		env_proc = dict(os.environ)
		if "LD_LIBRARY_PATH" in env_proc:
			env_proc["LD_LIBRARY_PATH"] += ":" + PARENT_DIR + "/bin"
		else:
			env_proc["LD_LIBRARY_PATH"] = ":" + PARENT_DIR + "/bin"
		self.backend_proc = subprocess.Popen(
			[PARENT_DIR + "/bin/backend"],
			env=env_proc)
		while True:
			await asyncio.sleep(1)

	async def _unload(self) -> None:
		"""
		Unload function
		"""
		print("MetaDeck unloading...")
		if self.backend_proc is not None:
			self.backend_proc.terminate()
			try:
				self.backend_proc.wait(timeout=5)  # 5 seconds timeout
			except subprocess.TimeoutExpired:
				self.backend_proc.kill()
			self.backend_proc = None

	# await Plugin.commit(self)
	async def _migration(self):
		decky_plugin.migrate_settings(
			os.path.join(decky_plugin.DECKY_HOME, "settings", "metadeck.json"))
		if os.path.exists(os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "metadeck.json")):
			os.rename(os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "metadeck.json"),
					os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"))

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
