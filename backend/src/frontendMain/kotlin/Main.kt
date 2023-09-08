import io.ktor.client.plugins.websocket.*
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.await
import kotlinx.coroutines.promise
import kotlinx.serialization.json.JsonObject
import yasdpl.HandlerRegistry
import yasdpl.WebsocketClient
import yasdpl.fromJsonDynamic
import yasdpl.toJsonDynamic
import kotlin.js.Promise

@ExperimentalJsExport
@JsExport
external interface SettingsData
{
	val metadata_id: dynamic
	val metadata_custom: dynamic
	val metadata: dynamic
	val client_id: String
	val client_secret: String
}
@Suppress("NON_EXPORTABLE_TYPE")
@DelicateCoroutinesApi
@ExperimentalJsExport
@JsExport
class MetaDeckClient : WebsocketClient(4200)
{
	override fun HandlerRegistry.initServices() = Unit

	fun readConfig(): Promise<SettingsData> = GlobalScope.promise {
		var config = JsonObject(mapOf())
		send("config", "readConfig") {
			config = receiveDeserialized<JsonObject>()
			return@send Result.success(Unit)
		}.await()
		return@promise config.fromJsonDynamic().unsafeCast<SettingsData>()
	}

	fun writeConfig(config: SettingsData): Promise<Unit> = GlobalScope.promise {
		send("config", "writeConfig") {
			sendSerialized(config.toJsonDynamic())
			return@send Result.success(Unit)
		}
	}
}