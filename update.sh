#!/bin/sh

sed "s/^version = .*/version = \"$(jq -r .version package.json | cut -f1 -d"-")\"/" -i pyproject.toml

if [ -d "venv" ]; then
	. venv/bin/activate
	pip install .
fi
pip install -t py_modules . --upgrade
cp src/py/main.py .
[ -d "py_modules/py" ] && rm -r "py_modules/py"