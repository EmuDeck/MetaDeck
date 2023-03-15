#!/bin/sh
set -e

if [ -f /.dockerenv ]; then
	apk add --no-cache python3 py3-pip
	pip3 install stickytape
fi
stickytape src/py/main.py > main.py