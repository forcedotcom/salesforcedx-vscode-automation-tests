# Salesforce Extensions for VS Code
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Introduction
This repository contains the source code for the automation tests for the Salesforce Extensions for VS Code.

### WDIO VSCode Service
This project is based on `WDIO VSCode Service, available at https://github.com/webdriverio-community/wdio-vscode-service

### Getting Started
If you are interested in contributing, please take a look at the [CONTRIBUTING](CONTRIBUTING.md) guide.

After cloning this repo, you will also need to clone https://github.com/forcedotcom/salesforcedx-vscode. The default topography is for `salesforcedx-vscode` and `salesforcedx-vscode-automation-tests` to reside side-by-side in the same parent location.

To install the dependencies, run `npm install`. You do not need to compile - when running the e2e automation tests the code is dynamically compiled.

After the dependencies have been installed, open the folder in Visual Studio Code, then debug using the `Debug All Automation Tests` configuration (or run using the `Run All Automation Tests` configuration).

### Environment Variables
The following is a list of environment variables that are used with this project. Each has a default value and are obtained using the [environmentSettings](test/environmentSettings.ts) class.

#### DEV_HUB_ALIAS_NAME
Default value: `vscodeOrg`

#### DEV_HUB_USER_NAME
Default value: `svc_idee_bot@salesforce.com`

#### EXTENSION_PATH
Default value: `{cwd}/../../salesforcedx-vscode/packages`

#### THROTTLE_FACTOR
Default value: 1
