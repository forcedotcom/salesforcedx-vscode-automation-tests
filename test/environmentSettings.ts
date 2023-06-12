/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join } from 'path';
import * as utilities from './utilities';

export class EnvironmentSettings {
  private static _instance: EnvironmentSettings;

  private _vscodeVersion = 'stable'; //  or 'insiders' or '1.77.3'
  private _testProjectHome = join(__dirname, '..', '..');
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
    // './test/specs/**/manifestBuilder.e2e.ts'
    // './test/specs/**/orgBrowser.e2e.ts',
    // './test/specs/**/pushAndPull.e2e.ts',
    // './test/specs/**/runApexTests.e2e.ts',
    // './test/specs/**/sObjectsDefinitions.e2e.ts',
    // './test/specs/**/templates.e2e.ts',
    // './test/specs/**/trailApexReplayDebugger.e2e.ts',
    // './test/specs/**/visualforceLsp.e2e.ts'
  ];
  private _devHubAliasName = 'vscodeOrg';
  private _devHubUserName = 'svc_idee_bot@salesforce.com';
  private _extensionPath = join(__dirname, '..', '..', 'salesforcedx-vscode', 'packages');
  private _startTime = new Date(Date.now()).toLocaleTimeString([], {
    timeStyle: 'short'
  });
  private _throttleFactor = 1;
  private _devHubSfdxAuthUrl?: string = undefined;

  private constructor() {
    this._vscodeVersion =
      process.env.VSCODE_VERSION || this._vscodeVersion;

    if (process.env.SPEC_FILES?.length) {
      this._specFiles = process.env.SPEC_FILES.split(',').map(
        specFile => `./test/specs/**/${specFile.trim()}`
      );
      utilities.log(`SPEC_FILES: ${this._specFiles.join(', ')}`);
    }

    this._devHubAliasName =
      process.env.DEV_HUB_ALIAS_NAME || this._devHubAliasName;
    this._devHubUserName =
      process.env.DEV_HUB_USER_NAME || this._devHubUserName;
    this._devHubSfdxAuthUrl =
      process.env.DEV_HUB_SFDX_AUTH_URL || this._devHubSfdxAuthUrl;
    this._extensionPath =
      process.env.EXTENSION_PATH || this._extensionPath;
    this._throttleFactor =
      parseInt(process.env.THROTTLE_FACTOR!) || this._throttleFactor;
    if (process.env.TEST_PROJECT_NAME) {
      this._testProjectHome = join(
        __dirname,
        '..',
        '..',
        process.env.TEST_PROJECT_NAME
      );
    }
  }

  public static getInstance(): EnvironmentSettings {
    if (!EnvironmentSettings._instance) {
      EnvironmentSettings._instance = new EnvironmentSettings();
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

  public get devHubSfdxAuthUrl(): string | undefined {
    return this._devHubSfdxAuthUrl;
  }

  public get throttleFactor(): number {
    return this._throttleFactor;
  }

  public get startTime(): string {
    return this._startTime;
  }

  public get testProjectHome(): string {
    return this._testProjectHome;
  }
}
