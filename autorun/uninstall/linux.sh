#!/bin/bash

cd "$(dirname "$0")"

echo "Deleting first_time variable"
rm ../first_time.txt
echo "Deactivating and uninstalling nodeJS"
nvm deactivate
nvm uninstall node
echo "Deleting nvm"
rm -rf ~/.nvm
rm -rf ~/.npm