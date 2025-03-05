#!/bin/sh
set -e

echo "Container's IP address: $(awk 'END{print $1}' /etc/hosts)"

cd /backend

mkdir -p build && cd build
cmake ..
make
cp hash ../out/hash
cd .. && rm -rf build

cd /plugin

python -m venv ./ci_venv
. ./ci_venv/bin/activate

sed "s/^version = .*/version = \"$(jq -r .version package.json | cut -f1 -d"-")\"/" -i pyproject.toml

if [ -d "venv" ]; then
	. venv/bin/activate
	pip install .
fi
pip install -t py_modules . --upgrade
cp src/py/main.py .
[ -d "py_modules/py" ] && rm -r "py_modules/py"

rm -rf ./ci_venv