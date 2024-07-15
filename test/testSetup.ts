/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { DefaultTreeItem, InputBox, QuickOpenBox, Workbench } from 'wdio-vscode-service';
import { EnvironmentSettings } from './environmentSettings.ts';
import * as utilities from './utilities/index.ts';
import { fail } from 'assert';

import { fileURLToPath } from 'url';
import { Duration } from '@salesforce/kit';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exec = util.promisify(child_process.exec);

export class TestSetup {
  public testSuiteSuffixName: string;
  private reuseScratchOrg = false;
  private static aliasAndUserNameWereVerified = false;
  public tempFolderPath: string | undefined = undefined;
  public projectFolderPath: string | undefined;
  private prompt: QuickOpenBox | InputBox | undefined;
  public scratchOrgAliasName: string | undefined;

  public constructor(testSuiteSuffixName: string, reuseScratchOrg: boolean) {
    this.testSuiteSuffixName = testSuiteSuffixName;
    this.reuseScratchOrg = reuseScratchOrg;

    // To have all scratch orgs be reused, uncomment the following line:
    // this.reuseScratchOrg = true;
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
    if (this.scratchOrgAliasName && !this.reuseScratchOrg) {
      // The Terminal view can be a bit unreliable, so directly call exec() instead:
      await exec(`sf org:delete:scratch --target-org ${this.scratchOrgAliasName} --no-prompt`);
    }
  }

  private async checkForUncaughtErrors(): Promise<void> {
    await utilities.showRunningExtensions();

    // Zoom out so all the extensions are visible
    await utilities.zoom('Out', 4, Duration.seconds(1));

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

    this.tempFolderPath = path.join(__dirname, '..', 'e2e-temp');

    this.projectFolderPath = path.join(this.tempFolderPath, this.tempProjectName);
    utilities.log(
      `${this.testSuiteSuffixName} - creating project files in ${this.projectFolderPath}`
    );

    // Remove the project folder, just in case there are stale files there.
    if (fs.existsSync(this.projectFolderPath)) {
      utilities.removeFolder(this.projectFolderPath);
    }

    // Now create the temp folder.  It should exist but create the folder if it is missing.
    if (!fs.existsSync(this.tempFolderPath)) {
      utilities.createFolder(this.tempFolderPath);
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished setUpTestingEnvironment()`);
    utilities.log('');
  }

  /**
   * @deprecated - this function has been overcome by events, will be removed soon
   * @param scratchOrgEdition
   */
  public async createInitialProject(scratchOrgEdition: utilities.OrgEdition): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting createInitialProject()...`);

    // If you are not in a VSCode project, the Salesforce extensions are not running
    // Force the CLI integration extension to load before creating the project
    const workbench = await utilities.getWorkbench();
    await utilities.showRunningExtensions();
    const prompt = await workbench.executeQuickPick('SFDX: Create Project');
    await utilities.waitForQuickPick(prompt, 'Standard', {
      msg: 'Expected extension salesforcedx-core to be available within 5 seconds',
      timeout: Duration.seconds(5)
    });
    await browser.keys(['Escape']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(['Escape']);

    const coreIsActive = await utilities.verifyExtensionsAreRunning(
      utilities
        .getExtensionsToVerifyActive((ext) => ext.extensionId === 'salesforcedx-vscode-core')
    );

    if (!coreIsActive) {
      fail('Expected core extension to be active after 20 seconds');
    }

    utilities.log(`${this.testSuiteSuffixName} - Ready to create the standard project`);

    await this.createProject(scratchOrgEdition);

    // Extra config needed for Apex LSP on GHA
    const os = process.platform;
    if (os === 'darwin') {
      this.setJavaHomeConfigEntry();
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished createInitialProject()`);
    utilities.log('');
  }

  public async createProject(scratchOrgEdition: utilities.OrgEdition, projectName?: string) {
    utilities.log('');
    utilities.log(`${projectName ?? this.testSuiteSuffixName} - Starting createProject()...`);
    this.prompt = await utilities.executeQuickPick('SFDX: Create Project');
    // Selecting "SFDX: Create Project" causes the extension to be loaded, and this takes a while.
    // Select the "Standard" project type.
    await utilities.waitForQuickPick(this.prompt, 'Standard', {
      msg: 'Expected extension salesforcedx-core to be available within 5 seconds',
      timeout: Duration.seconds(5)
    });

    // Enter the project's name.
    await this.prompt.setText(projectName ?? this.tempProjectName);
    await utilities.pause(Duration.seconds(2));

    // Press Enter/Return.
    await this.prompt.confirm();

    // Set the location of the project.
    const input = await this.prompt.input$;
    await input.setValue(this.tempFolderPath!);
    await utilities.pause(Duration.seconds(2));
    await utilities.clickFilePathOkButton();

    // Verify the project was created and was loaded.
    await this.verifyProjectCreated(projectName ?? this.tempProjectName);
    this.updateScratchOrgDefWithEdition(scratchOrgEdition);

    // Extra config needed for Apex LSP on GHA
    if (process.platform === 'darwin') {
      this.setJavaHomeConfigEntry();
    }
    utilities.log(`${this.testSuiteSuffixName} - ...finished createProject()`);
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
    const sfOrgDisplayResult = await exec(
      `sf org:display --target-org ${
        EnvironmentSettings.getInstance().devHubAliasName
      } --verbose --json`
    );
    const json = this.removedEscapedCharacters(sfOrgDisplayResult.stdout);

    // Now write the file.
    fs.writeFileSync(authFilePath, json);
    utilities.log(`${this.testSuiteSuffixName} - finished writing the file...`);

    // Call org:login:sfdx-url and read in the JSON that was just created.
    utilities.log(`${this.testSuiteSuffixName} - calling sf org:login:sfdx-url...`);
    const sfSfdxUrlStoreResult = await exec(`sf org:login:sfdx-url -d -f ${authFilePath}`);
    if (
      !sfSfdxUrlStoreResult.stdout.includes(
        `Successfully authorized ${EnvironmentSettings.getInstance().devHubUserName} with org ID`
      )
    ) {
      throw new Error(
        `In authorizeDevHub(), sfSfdxUrlStoreResult does not contain "Successfully authorized ${
          EnvironmentSettings.getInstance().devHubUserName
        } with org ID"`
      );
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished authorizeDevHub()`);
    utilities.log('');
  }

  // verifyAliasAndUserName() verifies that the alias and user name are set,
  // and also verifies there is a corresponding match in the org list.
  private async verifyAliasAndUserName() {
    const environmentSettings = EnvironmentSettings.getInstance();

    const devHubAliasName = environmentSettings.devHubAliasName;
    if (!devHubAliasName) {
      throw new Error('Error: devHubAliasName was not set.');
    }

    const devHubUserName = environmentSettings.devHubUserName;
    if (!devHubUserName) {
      throw new Error('Error: devHubUserName was not set.');
    }

    const execResult = await exec('sf org:list --json');
    const sfOrgListJson = this.removedEscapedCharacters(execResult.stdout);
    const sfOrgListResult = JSON.parse(sfOrgListJson).result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonScratchOrgs = sfOrgListResult.nonScratchOrgs as any[];

    for (let i = 0; i < nonScratchOrgs.length; i++) {
      const nonScratchOrg = nonScratchOrgs[i];
      if (nonScratchOrg.alias === devHubAliasName && nonScratchOrg.username === devHubUserName) {
        return;
      }
    }

    throw new Error(
      `Error: matching devHub alias '${devHubAliasName}' and devHub user name '${devHubUserName}' was not found.  Please consult README.md and make sure DEV_HUB_ALIAS_NAME and DEV_HUB_USER_NAME are set correctly.`
    );
  }

  private async createDefaultScratchOrg(
    edition: utilities.OrgEdition = 'developer'
  ): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting createDefaultScratchOrg()...`);

    utilities.log(`${this.testSuiteSuffixName} - calling transformedUserName()...`);
    const currentOsUserName = utilities.transformedUserName();

    utilities.log(`${this.testSuiteSuffixName} - calling getWorkbench()...`);
    const workbench = await utilities.getWorkbench();

    if (this.reuseScratchOrg) {
      utilities.log(`${this.testSuiteSuffixName} - looking for a scratch org to reuse...`);

      const sfOrgListResult = await exec('sf org:list --json');
      const resultJson = this.removedEscapedCharacters(sfOrgListResult.stdout);
      const scratchOrgs = JSON.parse(resultJson).result.scratchOrgs as { alias: string }[];

      const foundScratchOrg = scratchOrgs.find((scratchOrg) => {
        const alias = scratchOrg.alias as string;
        return (
          alias &&
          alias.includes('TempScratchOrg_') &&
          alias.includes(currentOsUserName) &&
          alias.includes(this.testSuiteSuffixName)
        );
      });

      if (foundScratchOrg) {
        this.scratchOrgAliasName = foundScratchOrg.alias as string;

        // Set the current scratch org.
        await this.setDefaultOrg(workbench);

        utilities.log(`${this.testSuiteSuffixName} - found one: ${this.scratchOrgAliasName}`);
        utilities.log(`${this.testSuiteSuffixName} - ...finished createDefaultScratchOrg()`);
        utilities.log('');
      }
    }

    utilities.log(`${this.testSuiteSuffixName} - calling path.join()...`);
    const definitionFile = path.join(this.projectFolderPath!, 'config', 'project-scratch-def.json');

    utilities.log(`${this.testSuiteSuffixName} - constructing scratchOrgAliasName...`);
    // Org alias format: TempScratchOrg_yyyy_mm_dd_username_ticks_testSuiteSuffixName
    const currentDate = new Date();
    const ticks = currentDate.getTime();
    const day = ('0' + currentDate.getDate()).slice(-2);
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const year = currentDate.getFullYear();
    this.scratchOrgAliasName = `TempScratchOrg_${year}_${month}_${day}_${currentOsUserName}_${ticks}_${this.testSuiteSuffixName}`;
    utilities.log(
      `${this.testSuiteSuffixName} - temporary scratch org name is ${this.scratchOrgAliasName}...`
    );

    const startDate = Date.now();
    const durationDays = 1;

    utilities.log(`${this.testSuiteSuffixName} - calling "sf org:create:scratch"...`);
    const sfOrgCreateResult = await exec(
      `sf org:create:scratch --edition ${edition} --definition-file ${definitionFile} --alias ${this.scratchOrgAliasName} --duration-days ${durationDays} --set-default --json`
    );
    utilities.log(`${this.testSuiteSuffixName} - ..."sf org:create:scratch" finished`);

    utilities.log(`${this.testSuiteSuffixName} - calling removedEscapedCharacters()...`);
    const json = this.removedEscapedCharacters(sfOrgCreateResult.stdout);

    utilities.log(`${this.testSuiteSuffixName} - calling JSON.parse()...`);
    const result = JSON.parse(json).result;

    const endDate = Date.now();
    const time = endDate - startDate;
    utilities.log(
      `Creating ${this.scratchOrgAliasName} took ${time} ticks (${time / 1_000.0} seconds)`
    );

    if (!result.authFields) {
      throw new Error('In createDefaultScratchOrg(), result.authFields is null (or undefined)');
    }

    if (!result.authFields.accessToken) {
      throw new Error(
        'In createDefaultScratchOrg(), result.authFields.accessToken is null (or undefined)'
      );
    }

    if (!result.orgId) {
      throw new Error('In createDefaultScratchOrg(), result.orgId is null (or undefined)');
    }

    if (!result.scratchOrgInfo.SignupEmail) {
      throw new Error(
        'In createDefaultScratchOrg(), result.scratchOrgInfo.SignupEmail is null (or undefined)'
      );
    }

    // Run SFDX: Set a Default Org
    utilities.log(`${this.testSuiteSuffixName} - selecting SFDX: Set a Default Org...`);
    const inputBox = await utilities.executeQuickPick(
      'SFDX: Set a Default Org',
      Duration.seconds(10)
    );

    utilities.log(`${this.testSuiteSuffixName} - calling findQuickPickItem()...`);
    const scratchOrgQuickPickItemWasFound = await utilities.findQuickPickItem(
      inputBox,
      this.scratchOrgAliasName,
      false,
      true
    );
    if (!scratchOrgQuickPickItemWasFound) {
      throw new Error(
        `In createDefaultScratchOrg(), the scratch org's pick list item was not found`
      );
    }

    await utilities.pause(Duration.seconds(3));

    // Warning! This only works if the item (the scratch org) is visible.
    // If there are many scratch orgs, not all of them may be displayed.
    // If lots of scratch orgs are created and aren't deleted, this can
    // result in this list growing one not being able to find the org
    // they are looking for.

    // Look for the success notification.
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Set a Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    if (!successNotificationWasFound) {
      throw new Error(
        'In createDefaultScratchOrg(), the notification of "SFDX: Set a Default Org successfully ran" was not found'
      );
    }

    // Look for this.scratchOrgAliasName in the list of status bar items.
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
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

  private async setDefaultOrg(workbench: Workbench): Promise<void> {
    const inputBox = await utilities.executeQuickPick(
      'SFDX: Set a Default Org',
      Duration.seconds(2)
    );

    const scratchOrgQuickPickItemWasFound = await utilities.findQuickPickItem(
      inputBox,
      this.scratchOrgAliasName!,
      false,
      true
    );
    if (!scratchOrgQuickPickItemWasFound) {
      throw new Error(`In setDefaultOrg(), the scratch org's quick pick item was not found`);
    }

    await utilities.pause(Duration.seconds(3));

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Set a Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    if (!successNotificationWasFound) {
      throw new Error(
        'In setDefaultOrg(), the notification of "SFDX: Set a Default Org successfully ran" was not found'
      );
    }

    // Look for the org's alias name in the list of status bar items.
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      this.scratchOrgAliasName!
    );
    if (!scratchOrgStatusBarItem) {
      throw new Error(
        'In setDefaultOrg(), getStatusBarItemWhichIncludes() returned a scratchOrgStatusBarItem with a value of null (or undefined)'
      );
    }
  }

  private removedEscapedCharacters(stdout: string): string {
    // When calling exec(), the JSON returned contains escaped characters.
    // Removed the extra escaped characters and carriage returns.
    const resultJson = stdout.replace(/\u001B\[\d\dm/g, '').replace(/\\n/g, '');

    return resultJson;
  }

  private setJavaHomeConfigEntry(): void {
    const vscodeSettingsPath = path.join(this.projectFolderPath!, '.vscode', 'settings.json');
    if (!EnvironmentSettings.getInstance().javaHome) {
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

  private async verifyProjectCreated(projectName: string) {
    utilities.log(`${this.testSuiteSuffixName} - Verifying project was created...`);

    // Reload the VS Code window
    const workbench = await utilities.getWorkbench();
    await utilities.reloadWindow();
    await utilities.showExplorerView();

    const sidebar = await workbench.getSideBar().wait();
    const content = await sidebar.getContent().wait();
    const treeViewSection = await (await content.getSection(projectName.toUpperCase())).wait();
    if (!treeViewSection) {
      throw new Error(
        'In verifyProjectCreated(), getSection() returned a treeViewSection with a value of null (or undefined)'
      );
    }

    const forceAppTreeItem = (await treeViewSection.findItem('force-app')) as DefaultTreeItem;
    if (!forceAppTreeItem) {
      throw new Error(
        'In verifyProjectCreated(), findItem() returned a forceAppTreeItem with a value of null (or undefined)'
      );
    }

    await (await forceAppTreeItem.wait()).expand();
    utilities.log(`${this.testSuiteSuffixName} - Verifying project complete`);
  }
}
