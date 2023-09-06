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
  private _devHubUserName = 'svcideebot@salesforce.com';
  private _sfdxAuthUrl = process.env.SFDX_AUTH_URL;
  private _orgId = process.env.ORG_ID;
  private _extensionPath = join(__dirname, '..', '..', 'salesforcedx-vscode', 'packages');
  private _startTime = new Date(Date.now()).toLocaleTimeString([], { timeStyle: 'short' });
  private _throttleFactor = 1;

  private constructor() {}

  public static getInstance(): EnvironmentSettings {
    if (!EnvironmentSettings._instance) {
      EnvironmentSettings._instance = new EnvironmentSettings();

      EnvironmentSettings._instance._vscodeVersion =
        process.env.VSCODE_VERSION || EnvironmentSettings._instance._vscodeVersion;

      if (process.env.SPEC_FILES) {

        // Step 1: Parse the string of inputs into an array by splitting on plus signs
        let e2eTestList = process.env.SPEC_FILES.split('+');

        // Step 2: Iterate through the array of e2e tests
        // Step 3: Add each file './test/specs/**/<name>.e2e.ts' to specFilesList
        let specFilesList = [];
        if (e2eTestList.length === 1) {
          throw Error('No E2E tests selected');
        }
        for (let index in e2eTestList) {
          if (+index === 0) {
            // The first element is always dummyvalue - can skip
          }
          else {
            specFilesList.push('./test/specs/**/' + e2eTestList[index]);
          }
        }

        EnvironmentSettings._instance._specFiles = specFilesList;
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
}
