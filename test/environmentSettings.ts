/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join } from 'path';

export class EnvironmentSettings {
  private static _instance: EnvironmentSettings;

  private _vscodeVersion = 'stable';
  private _specFiles = [
    './test/specs/**/*.e2e.ts'
    // OR
    // './test/specs/**/anInitialSuite.e2e.ts',
    // './test/specs/**/apexLsp.e2e.ts',
    // './test/specs/**/apexReplayDebugger.e2e.ts',
    // './test/specs/**/auraLsp.e2e.ts',
    // './test/specs/**/authentication.e2e.ts',
    // './test/specs/**/debugApexTests.e2e.ts',
    // './test/specs/**/deployAndRetrieve.e2e.ts',
    // './test/specs/**/lwcLsp.e2e.ts',
    // './test/specs/**/manifestBuilder.e2e.ts',
    // './test/specs/**/orgBrowser.e2e.ts',
    // './test/specs/**/pushAndPull.e2e.ts',
    // './test/specs/**/runApexTests.e2e.ts',
    // './test/specs/**/sObjectsDefinitions.e2e.ts',
    // './test/specs/**/templates.e2e.ts',
    // './test/specs/**/trailApexReplayDebugger.e2e.ts',
    // './test/specs/**/visualforceLsp.e2e.ts'
  ];
  private _devHubAliasName = 'vscodeOrg';
  private _devHubUserName = 'svcideebot@salesforce.com';
  private _sfdxAuthUrl = process.env.SFDX_AUTH_URL;
  private _orgId = process.env.ORG_ID;
  private _extensionPath = join(__dirname, '..', '..', 'salesforcedx-vscode', 'extensions');

  private _startTime = new Date(Date.now()).toLocaleTimeString([], { timeStyle: 'short' });
  private _throttleFactor = 1;
  private _javaHome = process.env.JAVA_HOME;
  private _useExistingProject: string | undefined;
  private _debug = false;

  private constructor() {}

  public static getInstance(): EnvironmentSettings {
    if (!EnvironmentSettings._instance) {
      EnvironmentSettings._instance = new EnvironmentSettings();

      EnvironmentSettings._instance._vscodeVersion =
        process.env.VSCODE_VERSION || EnvironmentSettings._instance._vscodeVersion;

      if (process.env.SPEC_FILES) {
        EnvironmentSettings._instance._specFiles = ['./test/specs/**/' + process.env.SPEC_FILES];
      }

      EnvironmentSettings._instance._devHubAliasName =
        process.env.DEV_HUB_ALIAS_NAME || EnvironmentSettings._instance._devHubAliasName;
      EnvironmentSettings._instance._devHubUserName =
        process.env.DEV_HUB_USER_NAME || EnvironmentSettings._instance._devHubUserName;
      EnvironmentSettings._instance._extensionPath =
        process.env.EXTENSION_PATH || EnvironmentSettings._instance._extensionPath;
      EnvironmentSettings._instance._throttleFactor =
        parseInt(process.env.THROTTLE_FACTOR!) || EnvironmentSettings._instance._throttleFactor;
      EnvironmentSettings._instance._sfdxAuthUrl =
        process.env.SFDXAUTHURL_TEST || EnvironmentSettings._instance._sfdxAuthUrl;
      EnvironmentSettings._instance._orgId =
        process.env.ORG_ID || EnvironmentSettings._instance._orgId;
      EnvironmentSettings._instance._extensionPath =
        process.env.SALESFORCEDX_VSCODE_EXTENSIONS_PATH ||
        EnvironmentSettings._instance._extensionPath;
      EnvironmentSettings._instance._useExistingProject =
        process.env.USE_EXISTING_PROJECT_PATH || EnvironmentSettings._instance._useExistingProject;
      EnvironmentSettings._instance._debug =
        process.env.E2E_DEBUG === 'true' || EnvironmentSettings._instance._debug;
    }

    return EnvironmentSettings._instance;
  }

  public get vscodeVersion(): string {
    return this._vscodeVersion;
  }

  public get specFiles(): string[] {
    return this._specFiles;
  }

  public get devHubAliasName(): string {
    return this._devHubAliasName;
  }

  public get devHubUserName(): string {
    return this._devHubUserName;
  }

  public get extensionPath(): string {
    return this._extensionPath;
  }

  public get throttleFactor(): number {
    return this._throttleFactor;
  }

  public get startTime(): string {
    return this._startTime;
  }

  public get sfdxAuthUrl(): string | undefined {
    return this._sfdxAuthUrl;
  }

  public get orgId(): string | undefined {
    return this._orgId;
  }

  public get javaHome(): string | undefined {
    return this._javaHome;
  }

  public get useExistingProject(): string | undefined {
    return this._useExistingProject;
  }

  public get debug(): boolean {
    return this._debug;
  }
}
