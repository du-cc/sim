#!/bin/bash

cd "$(dirname "$0")"

FLAG_FILE="first_time.txt"

run_app() {
    echo "Running..."
    npm run start
    exit 0
}

if [ ! -f "$FLAG_FILE" ]; then
    echo "FALSE" > "$FLAG_FILE"
    
    echo "Installing nvm and Node..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
    
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    nvm install node
    nvm use node
    
    echo "Installing required dependencies..."
    npm install
    
    run_app
else
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    run_app
fi