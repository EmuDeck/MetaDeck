#!/bin/sh

cp src/py/*.py .
if [ -d "/out" ] && [ -d "/plugin" ]; then
	mkdir -p /plugin/lib/frontend
	cp /out/bin/frontend/* /plugin/lib/frontend/
	rm -rf /out/bin/frontend
else
	mkdir -p ./lib/frontend && rm ./lib/frontend/*
	cd ./backend || exit
	./gradlew build
	cp ./build/js/packages/MetaDeck-frontend/kotlin/* ../lib/frontend/
	cd .. || exit
fi