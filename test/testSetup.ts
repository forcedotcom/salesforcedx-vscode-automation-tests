/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs';
import path from 'path';
import { InputBox, QuickOpenBox } from 'wdio-vscode-service';
import { EnvironmentSettings as Env } from './environmentSettings.ts';
import * as utilities from './utilities/index.ts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TestSetup {
  public testSuiteSuffixName: string;
  private static aliasAndUserNameWereVerified = false;
  public tempFolderPath: string;
  public projectFolderPath: string | undefined;
  private prompt: QuickOpenBox | InputBox | undefined;
  public scratchOrgAliasName: string | undefined;
  public scratchOrgId: string | undefined;

  public constructor(testSuiteSuffixName: string) {
    this.testSuiteSuffixName = testSuiteSuffixName;
    this.tempFolderPath = path.join(__dirname, '..', 'e2e-temp');
  }

  public get tempProjectName(): string {
    return 'TempProject-' + this.testSuiteSuffixName;
  }

  public async setUp(scratchOrgEdition: utilities.OrgEdition = 'developer'): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting TestSetup.setUp()...`);
    await utilities.installExtensions();
    await utilities.reloadAndEnableExtensions();
    await this.setUpTestingEnvironment();
    await this.createProject(scratchOrgEdition);
    await utilities.reloadAndEnableExtensions();
    await utilities.verifyExtensionsAreRunning(utilities.getExtensionsToVerifyActive());
    await this.authorizeDevHub();
    await this.createDefaultScratchOrg();
    utilities.log(`${this.testSuiteSuffixName} - ...finished TestSetup.setUp()`);
    utilities.log('');
  }

  public async tearDown(): Promise<void> {
    await this.checkForUncaughtErrors();
    try {
      await utilities.deleteScratchOrg(this.scratchOrgAliasName);
      await this.deleteScratchOrgInfo();
    } catch (error) {
      utilities.log(
        `Deleting scratch org (or info) failed with Error: ${(error as Error).message}`
      );
    }
  }

  private async deleteScratchOrgInfo(): Promise<void> {
    if (this.scratchOrgId) {
      const sfDataDeleteRecord = await utilities.runCliCommand(
        'data:delete:record',
        '--sobject',
        'ScratchOrgInfo',
        '--where',
        `ScratchOrg=${this.scratchOrgId.slice(0, -3)}`,
        '--target-org',
        Env.getInstance().devHubAliasName
      );
      if (sfDataDeleteRecord.exitCode > 0) {
        const message = `data delete record failed with exit code ${sfDataDeleteRecord.exitCode}\n stderr ${sfDataDeleteRecord.stderr}`;
        utilities.log(message);
        throw new Error(message);
      }
    }
  }

  private async checkForUncaughtErrors(): Promise<void> {
    await utilities.showRunningExtensions();

    // Zoom out so all the extensions are visible
    await utilities.zoom('Out', 4, utilities.Duration.seconds(1));

    const uncaughtErrors = (
      await utilities.findExtensionsInRunningExtensionsList(
        utilities.getExtensionsToVerifyActive().map((ext) => ext.extensionId)
      )
    ).filter((ext) => ext.hasBug);

    await utilities.zoomReset();

    uncaughtErrors.forEach((ext) => {
      utilities.log(`Extension ${ext.extensionId}:${ext.version ?? 'unknown'} has a bug`);
    });

    await expect(uncaughtErrors.length).toBe(0);
  }

  public async setUpTestingEnvironment(): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting setUpTestingEnvironment()...`);

    this.projectFolderPath = Env.getInstance().useExistingProject
      ? Env.getInstance().useExistingProject
      : path.join(this.tempFolderPath, this.tempProjectName);
    utilities.log(
      `${this.testSuiteSuffixName} - creating project files in ${this.projectFolderPath}`
    );

    // Remove the project folder, just in case there are stale files there, but only if it is not an existing project.
    if (this.projectFolderPath && !Env.getInstance().useExistingProject) {
      if (fs.existsSync(this.projectFolderPath)) {
        utilities.removeFolder(this.projectFolderPath);
      }

      // Now create the temp folder.  It should exist but create the folder if it is missing.
      if (!fs.existsSync(this.tempFolderPath)) {
        utilities.createFolder(this.tempFolderPath);
      }
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished setUpTestingEnvironment()`);
    utilities.log('');
  }

  public async createProject(scratchOrgEdition: utilities.OrgEdition, projectName?: string) {
    utilities.log('');
    if (!Env.getInstance().useExistingProject) {
      utilities.log(`${projectName ?? this.testSuiteSuffixName} - Starting createProject()...`);

      await utilities.generateSfProject(projectName ?? this.tempProjectName, this.tempFolderPath); // generate new sf project with cli

      if (projectName) {
        this.projectFolderPath = path.join(this.tempFolderPath, projectName);
        utilities.log(
          `${this.testSuiteSuffixName} - new projectFolderPath is ${this.projectFolderPath}`
        );
      }

      await utilities.openFolder(this.projectFolderPath!); // switch to the new VS Code workspace

      // Verify the project was created and was loaded.
      await utilities.verifyProjectCreated(projectName ?? this.tempProjectName);
      this.updateScratchOrgDefWithEdition(scratchOrgEdition);

      // Extra config needed for Apex LSP on GHA
      if (process.platform === 'darwin') {
        this.setJavaHomeConfigEntry();
      }
      utilities.log(`${this.testSuiteSuffixName} - ...finished createProject()`);
    } else {
      utilities.log(
        `${this.testSuiteSuffixName} - skipping createProject() as test is using an existing project`
      );
    }
    utilities.log('');
  }

  public async authorizeDevHub(): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting authorizeDevHub()...`);

    // Only need to check this once.
    if (!TestSetup.aliasAndUserNameWereVerified) {
      await this.verifyAliasAndUserName();
      TestSetup.aliasAndUserNameWereVerified = true;
    }

    // This is essentially the "SFDX: Authorize a Dev Hub" command, but using the CLI and an auth file instead of the UI.
    const authFilePath = path.join(this.projectFolderPath!, 'authFile.json');
    utilities.log(`${this.testSuiteSuffixName} - calling sf org:display...`);
    const sfOrgDisplayResult = await utilities.orgDisplay(Env.getInstance().devHubUserName);

    // Now write the file.
    fs.writeFileSync(authFilePath, sfOrgDisplayResult.stdout);
    utilities.log(`${this.testSuiteSuffixName} - finished writing the file...`);

    // Call org:login:sfdx-url and read in the JSON that was just created.
    utilities.log(`${this.testSuiteSuffixName} - calling sf org:login:sfdx-url...`);
    await utilities.orgLoginSfdxUrl(authFilePath);

    utilities.log(`${this.testSuiteSuffixName} - ...finished authorizeDevHub()`);
    utilities.log('');
  }

  // verifyAliasAndUserName() verifies that the alias and user name are set,
  // and also verifies there is a corresponding match in the org list.
  private async verifyAliasAndUserName() {
    const environmentSettings = Env.getInstance();

    const devHubAliasName = environmentSettings.devHubAliasName;
    if (!devHubAliasName) {
      throw new Error('Error: devHubAliasName was not set.');
    }

    const devHubUserName = environmentSettings.devHubUserName;
    if (!devHubUserName) {
      throw new Error('Error: devHubUserName was not set.');
    }

    const execResult = await utilities.orgList();
    const sfOrgListResult = JSON.parse(execResult.stdout).result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonScratchOrgs = sfOrgListResult.nonScratchOrgs as any[];

    for (let i = 0; i < nonScratchOrgs.length; i++) {
      const nonScratchOrg = nonScratchOrgs[i];
      if (nonScratchOrg.alias === devHubAliasName && nonScratchOrg.username === devHubUserName) {
        return;
      }
    }

    throw new Error(
      `Error: matching devHub alias '${devHubAliasName}' and devHub user name '${devHubUserName}' was not found.\nPlease consult README.md and make sure DEV_HUB_ALIAS_NAME and DEV_HUB_USER_NAME are set correctly.`
    );
  }

  private async createDefaultScratchOrg(
    edition: utilities.OrgEdition = 'developer'
  ): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting createDefaultScratchOrg()...`);

    const definitionFile = path.join(this.projectFolderPath!, 'config', 'project-scratch-def.json');

    utilities.debug(`${this.testSuiteSuffixName} - constructing scratchOrgAliasName...`);
    // Org alias format: TempScratchOrg_yyyy_mm_dd_username_ticks_testSuiteSuffixName
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();

    const currentOsUserName = utilities.transformedUserName();

    this.scratchOrgAliasName = `TempScratchOrg_${year}_${month}_${day}_${currentOsUserName}_${currentDate.getTime()}_${this.testSuiteSuffixName}`;
    utilities.log(
      `${this.testSuiteSuffixName} - temporary scratch org name is ${this.scratchOrgAliasName}...`
    );

    const startHr = process.hrtime();

    const sfOrgCreateResult = await utilities.scratchOrgCreate(
      edition,
      definitionFile,
      this.scratchOrgAliasName,
      1
    );
    utilities.debug(`${this.testSuiteSuffixName} - calling JSON.parse()...`);
    const result = JSON.parse(sfOrgCreateResult.stdout).result;

    const endHr = process.hrtime(startHr);
    const time = endHr[0] * 1_000_000_000 + endHr[1] - (startHr[0] * 1_000_000_000 + startHr[1]);

    utilities.log(
      `Creating ${this.scratchOrgAliasName} took ${time} ticks (${time / 1_000.0} seconds)`
    );
    if (!result?.authFields?.accessToken || !result.orgId || !result.scratchOrgInfo.SignupEmail) {
      throw new Error(
        `In createDefaultScratchOrg(), result is missing required fields.\nAuth Fields: ${result.authFields}\nOrg ID: ${result.orgId}\nSign Up Email: ${result.scratchOrgInfo.SignupEmail}.`
      );
    }
    this.scratchOrgId = result.orgId as string;

    // Run SFDX: Set a Default Org
    utilities.log(`${this.testSuiteSuffixName} - selecting SFDX: Set a Default Org...`);

    await utilities.setDefaultOrg(this.scratchOrgAliasName);

    await utilities.pause(utilities.Duration.seconds(3));

    // Look for the success notification.
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Set a Default Org successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    if (!successNotificationWasFound) {
      throw new Error(
        'In createDefaultScratchOrg(), the notification of "SFDX: Set a Default Org successfully ran" was not found'
      );
    }

    // Look for this.scratchOrgAliasName in the list of status bar items.
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(
      this.scratchOrgAliasName
    );
    if (!scratchOrgStatusBarItem) {
      throw new Error(
        'In createDefaultScratchOrg(), getStatusBarItemWhichIncludes() returned a scratchOrgStatusBarItem with a value of null (or undefined)'
      );
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished createDefaultScratchOrg()`);
    utilities.log('');
  }

  private setJavaHomeConfigEntry(): void {
    const vscodeSettingsPath = path.join(this.projectFolderPath!, '.vscode', 'settings.json');
    if (!Env.getInstance().javaHome) {
      return;
    }
    if (!fs.existsSync(path.dirname(vscodeSettingsPath))) {
      fs.mkdirSync(path.dirname(vscodeSettingsPath), { recursive: true });
    }

    let settings = fs.existsSync(vscodeSettingsPath)
      ? JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf8'))
      : {};

    settings = {
      ...settings,
      ...(process.env.JAVA_HOME
        ? { 'salesforcedx-vscode-apex.java.home': process.env.JAVA_HOME }
        : {})
    };
    fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
    utilities.log(
      `${this.testSuiteSuffixName} - Set 'salesforcedx-vscode-apex.java.home' to '${process.env.JAVA_HOME}' in ${vscodeSettingsPath}`
    );
  }

  private updateScratchOrgDefWithEdition(scratchOrgEdition: utilities.OrgEdition) {
    if (scratchOrgEdition === 'enterprise') {
      const projectScratchDefPath = path.join(
        this.tempFolderPath!,
        this.tempProjectName,
        'config',
        'project-scratch-def.json'
      );
      let projectScratchDef = fs.readFileSync(projectScratchDefPath, 'utf8');
      projectScratchDef = projectScratchDef.replace(
        `"edition": "Developer"`,
        `"edition": "Enterprise"`
      );
      fs.writeFileSync(projectScratchDefPath, projectScratchDef, 'utf8');
    }
  }
}
