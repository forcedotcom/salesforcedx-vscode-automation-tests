/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path';

export class EnvironmentSettings {
  private static _instance: EnvironmentSettings;

  private _devHubAliasName = 'vscodeOrg';
  private _devHubUserName = 'svc_idee_bot@salesforce.com';
  private _extensionPath = path.join(__dirname, '..', '..', 'salesforcedx-vscode', 'packages');
  private _throttleFactor = 1;

  private constructor() {
  }

  public static getInstance(): EnvironmentSettings {
    if (!EnvironmentSettings._instance) {
      EnvironmentSettings._instance = new EnvironmentSettings();

      EnvironmentSettings._instance._devHubAliasName = process.env.DEV_HUB_ALIAS_NAME || EnvironmentSettings._instance._devHubAliasName;
      EnvironmentSettings._instance._devHubUserName = process.env.DEV_HUB_USER_NAME || EnvironmentSettings._instance._devHubUserName;
      EnvironmentSettings._instance._extensionPath = process.env.EXTENSION_PATH || EnvironmentSettings._instance._extensionPath;
      EnvironmentSettings._instance._throttleFactor = parseInt(process.env.THROTTLE_FACTOR!) || EnvironmentSettings._instance._throttleFactor;
    }

    return EnvironmentSettings._instance;
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
}
