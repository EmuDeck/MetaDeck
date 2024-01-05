import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import org.jetbrains.kotlin.gradle.plugin.mpp.pm20.util.archivesName

val yasdplVersion: String by project

plugins {
	kotlin("multiplatform") version "1.9.0"
	kotlin("plugin.serialization") version "1.9.0"
	id("com.github.johnrengelman.shadow") version "8.1.1"
	id("org.graalvm.buildtools.native") version "0.9.8"
	application
}

group = "com.emudeck"
version = "1.0-SNAPSHOT"

repositories {
	mavenCentral()
//	maven {
//		url = uri("./lib")
//	}
	maven {
		url = uri("https://s01.oss.sonatype.org/content/repositories/snapshots/")
	}
}

kotlin {
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

	jvm("backend") {
		withJava()
	}
	sourceSets {
		val backendMain by getting {
			dependencies {

				implementation("io.github.emudeck.yasdpl:yasdpl-backend:$yasdplVersion")
			}
		}
		val backendTest by getting

		val commonMain by getting {
			dependencies {
				implementation("io.github.emudeck.yasdpl:yasdpl:$yasdplVersion")
			}
		}

		val commonTest by getting

		val frontendMain by getting {
			dependencies {
				implementation("io.github.emudeck.yasdpl:yasdpl-frontend:$yasdplVersion")
			}
		}

		val frontendTest by getting

	}
}

application {
	mainClass.set("MainKt")
}

tasks.withType<ShadowJar> {
	archiveFileName.set("backend.jar")
}

graalvmNative {
	binaries {
		named("main") {
			fallback.set(false)
			verbose.set(true)

			buildArgs.add("--initialize-at-build-time=ch.qos.logback")
			buildArgs.add("--initialize-at-build-time=io.ktor,kotlin")
			buildArgs.add("--initialize-at-build-time=org.slf4j.LoggerFactory")
			buildArgs.add("--initialize-at-run-time=io.ktor.serialization.kotlinx.json.JsonSupportKt")

			buildArgs.add("-H:+InstallExitHandlers")
			buildArgs.add("-H:+ReportUnsupportedElementsAtRuntime")
			buildArgs.add("-H:+ReportExceptionStackTraces")

			imageName.set("backend")
		}
	}
}