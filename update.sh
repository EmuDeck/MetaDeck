#!/bin/sh

sed "s/^version = .*/version = $(jq .version package.json)/" -i pyproject.toml

if [ -d "venv" ]; then
	. venv/bin/activate
	pip install .
fi
pip install -t py_modules . --upgrade
#pip install wenv
#wenv init
#wget https://github.com/git-for-windows/git/releases/download/v2.48.1.windows.1/Git-2.48.1-64-bit.exe
#Xvfb :0 -screen 0 1024x768x16 &
#DISPLAY=:0.0 WINEPREFIX=/tmp/.wine64 WINEARCH=win64 wine Git-2.48.1-64-bit.exe /VERYSILENT /NORESTART
#rm Git-2.48.1-64-bit.exe
#wenv pip install setuptools
#wenv pip install .
#wenv pip install -t py_modules .
cp src/py/main.py .
rm -r py_modules/py