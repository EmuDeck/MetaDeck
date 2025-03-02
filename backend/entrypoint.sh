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

./update.sh || 1

rm -rf ./ci_venv