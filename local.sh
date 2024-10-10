#!/bin/bash
decky plugin build
sudo cp out/MetaDeck.zip ~/homebrew/plugins/
pushd ~/homebrew/plugins/
sudo unzip MetaDeck.zip
popd
sudo systemctl restart plugin_loader.service
