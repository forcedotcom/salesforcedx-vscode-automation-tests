/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import * as fs from 'fs';
import { join } from 'path';
import path from 'path';

import { fileURLToPath } from 'url';
import { LOG_LEVELS, LogLevel } from './utilities/constants.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EnvironmentSettings {
  private static _instance: EnvironmentSettings;

  private _vscodeVersion = 'stable';
  private _specFiles = [
    './specs/**/*.e2e.ts'
    // OR
    // './specs/**/anInitialSuite.e2e.ts',
    // './specs/**/apexLsp.e2e.ts',
    // './specs/**/apexReplayDebugger.e2e.ts',
    // './specs/**/auraLsp.e2e.ts',
    // './specs/**/authentication.e2e.ts',
    // './specs/**/debugApexTests.e2e.ts',
    // './specs/**/deployAndRetrieve.e2e.ts',
    // './specs/**/lwcLsp.e2e.ts',
    // './specs/**/manifestBuilder.e2e.ts',
    // './specs/**/orgBrowser.e2e.ts',
    // './specs/**/pushAndPull.e2e.ts',
    // './specs/**/runApexTests.e2e.ts',
    // './specs/**/sObjectsDefinitions.e2e.ts',
    // './specs/**/templates.e2e.ts',
    // './specs/**/trailApexReplayDebugger.e2e.ts',
    // './specs/**/visualforceLsp.e2e.ts',
    // './specs/**/sfdxProjectJson.e2e.ts'
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
  private _storagePath: string;
  private _logLevel: LogLevel = 'info';

  private constructor() {
    this._vscodeVersion = process.env.VSCODE_VERSION || this._vscodeVersion;

    if (process.env.SPEC_FILES) {
      this._specFiles = ['./specs/**/' + process.env.SPEC_FILES];
    }

    this._devHubAliasName = process.env.DEV_HUB_ALIAS_NAME || this._devHubAliasName;
    this._devHubUserName = process.env.DEV_HUB_USER_NAME || this._devHubUserName;
    this._extensionPath = process.env.EXTENSION_PATH || this._extensionPath;
    this._throttleFactor = parseInt(process.env.THROTTLE_FACTOR!) || this._throttleFactor;
    this._sfdxAuthUrl = process.env.SFDX_AUTH_URL || this._sfdxAuthUrl;
    this._orgId = process.env.ORG_ID || this._orgId;
    this._extensionPath = process.env.SALESFORCEDX_VSCODE_EXTENSIONS_PATH || this._extensionPath;
    this._useExistingProject = process.env.USE_EXISTING_PROJECT_PATH || this._useExistingProject;
    this._logLevel = LOG_LEVELS.some(l => l === process.env.E2E_LOG_LEVEL)
      ? (process.env.E2E_LOG_LEVEL as LogLevel)
      : this._logLevel;
    this._javaHome = process.env.JAVA_HOME || this._javaHome;

    this._storagePath =
      process.env.E2E_VSCODE_STORAGE_PATH || `${os.tmpdir()}${path.sep}extension-test-storage`;
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

  public get logLevel(): LogLevel {
    return this._logLevel;
  }

  public get storagePath(): string {
    if (!fs.existsSync(this._storagePath)) {
      fs.mkdirSync(this._storagePath, { recursive: true });
    }
    return path.resolve(this._storagePath);
  }
}
