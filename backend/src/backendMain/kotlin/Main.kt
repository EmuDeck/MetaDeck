import io.ktor.server.websocket.*
import kotlinx.coroutines.*
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okio.FileSystem
import okio.Path.Companion.toPath
import yasdpl.DeckyEnv
import yasdpl.ServiceRegistry
import yasdpl.WebsocketServer

@ExperimentalSerializationApi
val prettyJson = Json {
	prettyPrint = true
	prettyPrintIndent = "\t"
}
suspend fun checkAndWriteDefaults() = coroutineScope {
	async(Dispatchers.IO)
	{
		DeckyEnv.settingsDir.fold({ settingsDir ->
			fun writeDefaults()
			{
				FileSystem.SYSTEM.write(settingsDir.toPath()/"settings.json")
				{
					writeUtf8(Json.encodeToString(JsonObject(mapOf(
						"metadata_id" to JsonObject(mapOf()),
						"metadata_custom" to JsonObject(mapOf()),
						"metadata" to JsonObject(mapOf()),
						"client_id" to JsonPrimitive(""),
						"client_secret" to JsonPrimitive("")
					))))
				}
			}
			if (FileSystem.SYSTEM.exists(settingsDir.toPath()/"settings.json"))
			{
				val settings = FileSystem.SYSTEM.read(settingsDir.toPath()/"settings.json")
				{
					readUtf8()
				}
				if (settings.isEmpty() || settings == "{}")
				{
					writeDefaults()
				}
			}
			else
			{
				writeDefaults()
			}
			Result.success(JsonNull)
		}, Result.Companion::failure).getOrThrow()
	}.await()
}

class MetaDeckServer : WebsocketServer(4200)
{
	override fun MutableList<String>.initBinds() = Unit

	@ExperimentalSerializationApi
	override fun ServiceRegistry.initServices()
	{
		register("config")
		{
			method("readConfig")
			{
				return@method withContext(Dispatchers.IO) {
					try {
						return@withContext DeckyEnv.settingsDir.fold({ settingsDir ->
							val contents = FileSystem.SYSTEM.read(settingsDir.toPath() / "settings.json")
							{
								readUtf8()
							}
							sendSerialized(JsonObject(prettyJson.decodeFromString<JsonObject>(contents)))
							return@fold Result.success(Unit)
						}, Result.Companion::failure)

					} catch (e: Exception) {
						return@withContext Result.failure(e)
					}
				}
			}
			method("writeConfig")
			{
				return@method coroutineScope {
					return@coroutineScope when (val parameters = receiveDeserialized<JsonObject?>())
					{
						is JsonObject ->
							async(Dispatchers.IO)
							{
								return@async DeckyEnv.settingsDir.fold<Result<Unit>, String>({ settingsDir ->
									FileSystem.SYSTEM.write(settingsDir.toPath()/"settings.json")
									{
										writeUtf8(prettyJson.encodeToString(parameters))
									}
									Result.success(Unit)
								}, Result.Companion::failure)
							}.await()
						null -> Result.failure(IllegalArgumentException("Parameters cannot be null"))
						else -> Result.failure(IllegalArgumentException("Invalid parameters"))
					}
				}.onFailure { this@MetaDeckServer.info(it.message ?: "") }
			}
		}
	}

}


fun main(): Unit = runBlocking {
	checkAndWriteDefaults()
	val backend = MetaDeckServer()
	backend()
}