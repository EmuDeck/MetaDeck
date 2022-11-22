import asyncio
import logging
import os
import pathlib
from typing import Dict, TypeVar

import time

from settings import SettingsManager

logging.basicConfig(
	filename="/tmp/metadeck.log",
	format='[MetaDeck] %(asctime)s %(levelname)s %(message)s',
	filemode='w+',
	force=True
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)  # can be changed to logging.DEBUG for debugging issues


class Game:
	def __init__(self, game_id: str):
		self.game_id: str = game_id
		self.start_time: float = time.time()
		self.paused_time: float = 0
		self.minus_time: float = 0

	def pause(self) -> None:
		"""
		Pauses the game counter
		"""
		self.paused_time = time.time()

	def resume(self) -> None:
		"""
		Resumes the game counter
		"""
		self.minus_time += time.time() - self.paused_time
		self.paused_time = 0

	def time_since_start(self) -> float:
		"""
		Gets the time since the start of the game

		:return: The time since start
		"""
		return (time.time() - self.start_time) - self.minus_time


class Plugin:
	settings: SettingsManager
	playtimes: Dict[str, float] = None
	running_games: Dict[str, Game] = {}
	last_started_game: str = ""

	async def _main(self) -> None:
		"""
		Load function
		"""
		settingsPath = pathlib.Path(__file__).parent.parent.parent.joinpath("settings").absolute()
		logger.debug(settingsPath)
		if settingsPath.joinpath("steamlesstimes.json").exists():
			os.rename(settingsPath.joinpath("steamlesstimes.json"), settingsPath.joinpath("metadeck.json"))
		Plugin.settings = SettingsManager("metadeck")
		await Plugin.read(self)
		Plugin.playtimes = await Plugin.get_setting(self, "playtimes", {})

	async def _unload(self) -> None:
		"""
		Unload function
		"""
		await Plugin.set_setting(self, "playtimes", Plugin.playtimes)

	async def on_lifetime_callback(self, data: dict) -> None:
		"""
		Called when steam has a lifetime event

		:param data: lifetime data passed from frontend
		"""
		logger.debug("Handling lifetime notification")
		logger.debug(f"Data: {data}")
		instanceId = data["nInstanceID"]
		appId = data["unAppID"]
		if int(appId) != 0:
			logger.debug(f"Ignoring steam game {appId}")
			return
		if data["bRunning"]:
			logger.debug(f"Game {instanceId} is running")
			if Plugin.last_started_game != "":
				Plugin.running_games[instanceId] = Game(Plugin.last_started_game)
				logger.debug(f"Started playing {Plugin.last_started_game}")
				Plugin.last_started_game = ""
			else:
				logger.warning(f"No last game running, cannot track {instanceId}")
		else:
			logger.debug(f"Game {instanceId} is not running")
			if instanceId in Plugin.running_games:
				logger.debug(f"Game {instanceId} was previously running")
				playtime = Plugin.running_games[instanceId].time_since_start()
				gameId = str(Plugin.running_games[instanceId].game_id)
				del (Plugin.running_games[instanceId])
				if gameId in Plugin.playtimes:
					logger.debug(f"Game {instanceId} has existing playtimes, appending")
					Plugin.playtimes[gameId] += playtime
				else:
					logger.debug(f"Game {instanceId} does not have existing playtimes, assigning")
					Plugin.playtimes[gameId] = playtime
				logger.debug(f"Played {gameId} for {playtime}s")
				await Plugin.set_setting(self, "playtimes", Plugin.playtimes)
			else:
				logger.warning(f"InstanceID {instanceId} not found in running games")

	async def on_game_start_callback(self, idk: int, game_id: str, action: str) -> None:
		"""
		Called when a game starts

		:param idk: No idea what this int steam passes is for
		:param game_id: The game id
		:param action: The action
		"""
		logger.debug(f"Handling game start callback {idk} {game_id} {action}")
		Plugin.last_started_game = game_id

	async def on_suspend_callback(self) -> None:
		"""
		Called when the deck is suspended
		"""
		Plugin.running_games[Plugin.last_started_game].pause()

	async def on_resume_callback(self) -> None:
		"""
		Called when the deck is resumed
		"""
		Plugin.running_games[Plugin.last_started_game].resume()

	async def get_playtimes(self) -> Dict[str, float] | None:
		"""
		Waits until playtimes is loaded, then returns the playtimes

		:return: The playtimes
		"""
		while Plugin.playtimes is None:
			await asyncio.sleep(0.1)
		logger.debug(f"Got playtimes {Plugin.playtimes}")
		return Plugin.playtimes

	async def reset_playtime(self, game_id: str) -> None:
		"""
		Resets the game's playtime

		:param game_id: The game id
		"""
		del Plugin.playtimes[game_id]
		await Plugin.set_setting(self, "playtimes", Plugin.playtimes)

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
