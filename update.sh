#!/bin/sh

sed "s/^version = .*/version = \"$(jq -r .version package.json | cut -f1 -d"-")\"/" -i pyproject.toml

if [ -d "venv" ]; then
	. venv/bin/activate
	pip install .
fi