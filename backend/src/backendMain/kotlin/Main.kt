import io.ktor.server.websocket.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import okio.FileSystem
import okio.Path.Companion.toPath
import yasdpl.DeckyEnv
import yasdpl.ServiceRegistry
import yasdpl.WebsocketServer

@OptIn(ExperimentalSerializationApi::class)
val prettyJson = Json {
	prettyPrint = true
	prettyPrintIndent = "\t"
}

suspend fun checkAndWriteDefaults() = withContext(Dispatchers.IO)
{
	fun writeDefaults()
	{
		FileSystem.SYSTEM.write(DeckyEnv.settingsDir.toPath() / "settings.json")
		{
			writeUtf8(
				prettyJson.encodeToString(
					JsonObject(
						mapOf(
							"metadata_id" to JsonObject(mapOf()),
							"metadata_custom" to JsonObject(mapOf()),
							"metadata" to JsonObject(mapOf())
						)
					)
				)
			)
		}
	}
	if (FileSystem.SYSTEM.exists(DeckyEnv.settingsDir.toPath() / "settings.json"))
	{
		val settings = FileSystem.SYSTEM.read(DeckyEnv.settingsDir.toPath() / "settings.json")
		{
			readUtf8()
		}
		if (settings.isEmpty())
		{
			writeDefaults()
		}
	} else
	{
		writeDefaults()
	}
	Result.success(JsonNull)
}

class MetaDeckServer : WebsocketServer(4200)
{
	override fun ServiceRegistry.initServices()
	{
		register("config")
		{
			method("readConfig")
			{
				logger.info { "Got readConfig request" }
				return@method withContext(Dispatchers.IO) {
					return@withContext runCatching {
						val contents = FileSystem.SYSTEM.read(DeckyEnv.settingsDir.toPath() / "settings.json")
						{
							readUtf8()
						}
						val json = prettyJson.decodeFromString<JsonObject>(contents)
						logger.info { "Read config from disk: \n $contents" }
						sendSerialized(json)
					}
				}
			}
			method("writeConfig")
			{
				logger.info { "Got writeConfig request" }
				return@method withContext(Dispatchers.IO) {
					return@withContext runCatching {
						val json = prettyJson.encodeToString(receiveDeserialized<JsonObject>())
						FileSystem.SYSTEM.write(DeckyEnv.settingsDir.toPath() / "settings.json")
						{
							writeUtf8(json)
						}
						logger.info { "Wrote config to disk: \n $json" }
					}
				}
			}
		}
	}
}

fun main(): Unit = runBlocking {
	checkAndWriteDefaults()
	val backend = MetaDeckServer()
	backend()
}