# SIM Timetable Downloader

These scripts interact with Microsoft B2C Authentication system to log user into SIM API. Then get required version informations from SIM API backend (OutSystems) to able to interact with it. Finally request and parse the timetable JSON data and convert it into iCalendar (.ics) file.

**ZERO** line of AI code. Only technical assistance (eg: analyze packets) was given.

> [!CAUTION]
>
> **DO NOT** send ANYTHING from **`/backend/data`** folder.
>
> It contains credentials that are able to bypass **2FA / MFA (Two / Multi Factor Authentication)**

> [!IMPORTANT]
> Timetable is subjected to changes. Make sure to check and update them accordingly.
>
> **I WILL NOT** be responsible to any attendance issue caused by this program.

> [!NOTE]
>
> Be sure to read this document fully as important informations or tips are down below.

## Questions? Bugs? Issues?

- Submit them via issues. [link](https://github.com/du-cc/sim/issues/new/choose)

## Installation

### Prerequisite

1. Download this repo as .zip [link](https://github.com/du-cc/sim/archive/refs/heads/main.zip)
   - OR:

   ```bash
   git clone https://github.com/du-cc/sim.git
   ```

2. Extract the .zip file to a folder (eg: sim-main)
   - For git cloners: You can skip this step.

> [!NOTE]
> If your computer already has node.js installed. Run `npm install` and `npm run start` in the root (main) folder of this repo to run the program.
>
> **DO NOT run any scripts in `/autorun` folder**, as it installs node.js
>
> If you want convenience and make use of autorun scripts, create a text file named `first_run.txt` in `/autorun` folder.

<hr>

### Windows

#### Installing node.js

#### Automatic install

1. Run `/autorun/windows.bat` as administrator.

2. Wait for it to automatically install everything needed.

> [!NOTE]
> After first installation, you can just normally run this file to run the program (No need administrator privilege)
>
> You can also create a shortcut to this file for easier access.

#### Manual install

1. Install node.js [link](https://nodejs.org/dist/v25.3.0/node-v25.3.0-x64.msi)
   - OR via chocolatey:

   ```bash
   powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
   choco install nodejs --version="25.3.0"
   ```

<hr>

### Linux / MacOS

#### Installing node.js

#### Automatic install

1. Go to `/autorun/linux.sh`

2. Open `Properties` of the file.

3. Check if `Executable as a program` or similar words are enabled.

4. Click `Run as a program` or similar words in right click menu.

5. Wait for it to install everything.

> [!NOTE]
> After first installation, you can run this file to also run the program.

#### Manual install

1. Install nodeJS
   - [Select your installation based on your system](https://nodejs.org/en/download/current) (At `Or get a prebuilt Node.js® for` section)
   - Linux: [.xz(x64)](https://nodejs.org/dist/v25.3.0/node-v25.3.0-linux-x64.tar.xz)
   - MacOS: [.pkg(x64)(Older Intel Macs)](https://nodejs.org/dist/v25.3.0/node-v25.3.0.pkg), [.pkg(ARM64)(M series cpus)](https://nodejs.org/dist/v25.3.0/node-v25.3.0.pkg)

   - OR: (Run in a terminal)

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
   \. "$HOME/.nvm/nvm.sh"
   nvm install node
   ```

## Run the program (manually)

- For automatic, see [Windows](#automatic-install), [Linux/MacOS](#automatic-install-1)

### Windows / Linux / MacOS

1. Open Terminal / Command Prompt (cmd)

2. Install required dependencies

```bash
cd <PATH_TO_FOLDER> # eg: sim-main or ~/Downloads/sim-main or C:\Users\ducc\Downloads\sim-main
npm install
```

3. Run the program

```bash
npm run start
```

## Uninstallation

> [!WARNING]
> If you wish to keep node.js and not to delete it. **DO NOT run any scripts in `/autorun/uninstall` folder**, as it also uninstalls node.js
>
> Instead, just delete the folder of this repo (eg: sim-main)

### Windows

1. Run `/autorun/uninstall/windows.bat` as administrator.

2. Wait for it to uninstall and delete everything.

3. Finally, delete the folder of this repo (eg: sim-main)

### Linux / MacOS

1. Run `/autorun/uninstall/linux.sh`

2. Wait for it to uninstall and delete everything.

3. Finally, delete the folder of this repo (eg: sim-main)

## Development

This repo has already done the most difficult part (Authentication and VersionData) fetching. You can expand it to interact with more API endpoints (eg: Room Booking).

> [!NOTE]
>
> You can of course interact with critical endpoints (eg: attendance) with this if you add and modify a little bit.
>
> But, **DO NOT** use it for unintended purpose. **I AM NOT** responsible to any disciplinary actions caused by this program.
