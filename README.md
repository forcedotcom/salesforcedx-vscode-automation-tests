# Salesforce Extensions for VS Code

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Introduction

This repository contains the source code for the automation tests for the Salesforce Extensions for VS Code.

### WDIO VSCode Service

This project is based on WDIO VSCode Service, available at https://github.com/webdriverio-community/wdio-vscode-service

### Getting Started

If you are interested in contributing, please take a look at the [CONTRIBUTING](CONTRIBUTING.md) guide.

After cloning this repo, you will also need to have a folder called `salesforcedx-vscode` residing side-by-side in the same parent location, and have the vsixes you want to test in `salesforcedx-vscode/extensions` directory. e.g:

```
.
├── ...
├── salesforcedx-vscode-automation-tests    # E2E Tests repo
├── salesforcedx-vscode
│   └── extensions                          # Directory containing the salesforce extensions
│       ├── salesforcedx-vscode-core-59.0.0.vsix
│       ├── salesforcedx-vscode-apex-59.0.0.vsix
│       └── ...
└── ...
```

To install the test dependencies, run `npm install`. You do not need to compile - when running the e2e automation tests, the code is dynamically compiled.

### Environment Variables

The following is a list of environment variables that are used with this project. Each has a default value and are obtained using the [environmentSettings](test/environmentSettings.ts) class.

- DEV_HUB_ALIAS_NAME

  - Default value: `vscodeOrg`

- DEV_HUB_USER_NAME

  - Default value: `svcideebot@salesforce.com`

- EXTENSION_PATH

  - Default value: `{cwd}/../../salesforcedx-vscode/extensions`

    Note: If your folder structure does not match the folder structure shown above in Getting Started section, `EXTENSION_PATH` will need to be set to the relative path to 'salesforcedx-vscode/extensions'. If it does match, then no changes are needed for.

- THROTTLE_FACTOR
  - Default value: `1`

### Dev Hub

A requirement of this project is for a Dev Hub to have been enabled on the user's machine. The default Dev Hub name is "vscodeOrg" and the default username is "svcideebot@salesforce.com", though this can be configured with the `DEV_HUB_ALIAS_NAME` and `DEV_HUB_USER_NAME` environment variables.
Run Task: Authorize DevHub - E2E Testing Org through command palette (Cmd+shft+P).
Once you are connected to the org with `DEV_HUB_ALIAS_NAME` and `DEV_HUB_USER_NAME`, you can run single or all end-to-end test suites.

### Run the tests

After the dependencies have been installed, the vsixes downloaded and stored in the right folder, and the environment variables have been set, open `salesforcedx-vscode-automation-tests` repo in Visual Studio Code, then debug using the `Debug All Automation Tests` configuration (or run using the `Run All Automation Tests` configuration) in RUN AND DEBUG section in the left sidebar.

Note: if no changes are made to `_specFiles` property in [environmentSettings](test/environmentSettings.ts) class, then all tests will be run. If you want to run only some, comment out `'./test/specs/**/*.e2e.ts'` line in that file and uncomment the tests you want to run.
