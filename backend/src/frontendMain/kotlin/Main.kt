import io.ktor.client.plugins.websocket.*
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.await
import kotlinx.coroutines.promise
import kotlinx.serialization.json.JsonObject
import yasdpl.*
import kotlin.js.Promise

@OptIn(ExperimentalJsExport::class)
@JsExport
external interface SettingsData
{
	var metadata_id: Any
	var metadata_custom: Any
	var metadata: Any
}
@Suppress("NON_EXPORTABLE_TYPE")
@OptIn(ExperimentalJsExport::class, DelicateCoroutinesApi::class)
@JsExport
object MetaDeckClient : WebsocketClient(4200)
{
	val logger = Logger(this, "MetaDeckClient")
	override fun ServiceRegistry.initServices() = Unit

	fun readConfig(): Promise<SettingsData> = GlobalScope.promise {
		var ret = JsonObject(mapOf())
		send("config", "readConfig") {
			ret = receiveDeserialized<JsonObject>()
			return@send Result.success(Unit)
		}.await()
		return@promise ret.fromJsonDynamic().unsafeCast<SettingsData>()
	}

	fun writeConfig(config: SettingsData): Promise<Unit> = GlobalScope.promise {
		send("config", "writeConfig") {
			sendSerialized(config.toJsonDynamic())
			return@send Result.success(Unit)
		}.await()
	}
}