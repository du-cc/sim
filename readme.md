# SIM Timetable Downloader

> [!CAUTION]
> **DO NOT** send ANYTHING from **/backend/data** folder. It contains credentials that are able to bypass 2FA/MFA (Two/Multi Factor Authentication)

> [!IMPORTANT]
> Timetable are subjected to changes. Make sure to check and update them accordingly. I WILL NOT be responsible to any attendance issue caused by this program.

> [!NOTE]
> Be sure to read this document fully as important informations or tips will be posted.

## Installation

### Windows

1. Run /autorun/windows.bat as administrator.

2. Wait for it to automatically install everything needed.

> [!NOTE]
> After first installation, you can just normally run this file to run the program (No need administrator privilege)
>
> You can also create a shortcut to this file for easier access.

### MacOS / Linux

1. Download this repo as .zip [link](https://github.com/du-cc/sim/archive/refs/heads/main.zip)

2. Extract the .zip file to a folder (eg: sim-main)

3. Install nodeJS
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install node
```

4. Install required dependencies
```bash
cd <PATH_TO_FOLDER> # eg: sim-main
npm install
```

5. Run the program
```bash
npm run start
```

