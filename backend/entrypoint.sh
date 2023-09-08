#!/bin/bash
set -e

mkdir -p ./.cache
[ -d "./.cache/.gradle" ] && cp -r ./.cache/.gradle /root/
[ -d "./.cache/.konan" ] && cp -r ./.cache/.konan /root/
./gradlew build
mkdir -p ./out
cp ./build/bin/backend/backendReleaseExecutable/backend.kexe ./out/backend
[ -d "/root/.gradle" ] && cp -r /root/.gradle ./.cache/
[ -d "/root/.konan" ] && cp -r /root/.konan ./.cache/
ldd ./out/backend
echo "Fixing link data for SteamOS"
patchelf --replace-needed libcrypt.so.1 libcrypt.so.2 ./out/backend
ldd ./out/backend
echo "Copying js files over for frontend"
mkdir -p ./out/frontend
cp ./build/js/packages/MetaDeck-frontend/kotlin/* ./out/frontend/