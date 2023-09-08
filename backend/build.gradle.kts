plugins {
	kotlin("multiplatform") version "1.9.0"
	kotlin("plugin.serialization") version "1.9.0"
}

group = "com.emudeck"
version = "1.0-SNAPSHOT"

repositories {
	mavenCentral()
//	maven {
//		url = uri("./lib")
//	}
	maven {
		url = uri("https://codeberg.org/api/packages/Witherking25/maven")
     }
}

kotlin {
	val okioVersion = "3.4.0"
	val ktor_version = "2.3.2"
	js("frontend", IR) {
		binaries.library()
		generateTypeScriptDefinitions()
		useCommonJs()
		browser {
			commonWebpackConfig(Action {
				export = true
				sourceMaps = true
				outputFileName = "frontend.js"
				cssSupport {
					enabled.set(true)
				}
			})
		}
	}

	linuxX64("backend") {
		binaries {
			executable("backend") {
				entryPoint = "main"
//				if (File("/.dockerenv").exists())

			}
		}
	}
	sourceSets {
		val backendMain by getting {
			dependencies {
				implementation("com.squareup.okio:okio:$okioVersion")

				implementation("com.emudeck.yasdpl:yasdpl-backend:2.0.0")
			}
		}
		val backendTest by getting

		val commonMain by getting {
			dependencies {
				implementation("com.emudeck.yasdpl:yasdpl:2.0.0")
				implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.5.1")

			}
		}

		val commonTest by getting

		val frontendMain by getting {
			dependencies {
				implementation("com.emudeck.yasdpl:yasdpl-frontend:2.0.0")
				implementation("io.ktor:ktor-client-websockets:$ktor_version")
				implementation("io.ktor:ktor-client-js:$ktor_version")
			}
		}

		val frontendTest by getting

	}
}
