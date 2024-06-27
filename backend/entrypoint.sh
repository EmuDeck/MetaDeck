#!/bin/bash
set -e
sudo chown -R 1000:1000 .
mkdir -p ./.cache
[ -d "./.cache/.gradle" ] && cp -r ./.cache/.gradle $HOME/
#[ -d "./.cache/.konan" ] && cp -r ./.cache/.konan /root/
#./gradlew kotlinUpgradeYarnLock build --refresh-dependencies
./gradlew kotlinUpgradeYarnLock build nativeBuild --refresh-dependencies
sudo mkdir -p ./out
#cp ./build/bin/backend/backendReleaseExecutable/backend.kexe ./out/backend
sudo cp ./build/native/nativeCompile/backend ./out/backend
sudo cp ./build/libs/backend.jar ./out/backend.jar
[ -d "$HOME/.gradle" ] && cp -r $HOME/.gradle ./.cache/
#[ -d "/root/.konan" ] && cp -r /root/.konan ./.cache/
#ldd ./out/backend
#echo "Fixing link data for SteamOS"
#patchelf --replace-needed libcrypt.so.1 libcrypt.so.2 ./out/backend
#ldd ./out/backend
echo "Copying js files over for frontend"
sudo mkdir -p ./out/frontend
sudo cp ./build/dist/frontend/productionLibrary/* ./out/frontend/
sudo cp -r ~/graalvm/graalvm-ce-java19-22.3.1 ./out/jvm
sudo chown -R 1000:1000 ./out