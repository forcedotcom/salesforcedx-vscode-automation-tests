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
import { EnvironmentSettings } from './environmentSettings';
import * as utilities from './utilities';

const exec = util.promisify(child_process.exec);

export class TestSetup {
  public testSuiteSuffixName: string;
  private static aliasAndUserNameWereVerified = false;
  public tempFolderPath: string | undefined = undefined;
  public projectFolderPath: string | undefined = undefined;
  private prompt: QuickOpenBox | InputBox | undefined;
  public scratchOrgAliasName: string | undefined;
  public scratchOrgId: string | undefined;

  public constructor(testSuiteSuffixName: string) {
    this.testSuiteSuffixName = testSuiteSuffixName;
  }

  public get tempProjectName(): string {
    return 'TempProject-' + this.testSuiteSuffixName;
  }

  public async setUp(scratchOrgEdition: string = 'Developer'): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting TestSetup.setUp()...`);
    await utilities.installExtensions();
    await utilities.reloadAndEnableExtensions();
    await this.setUpTestingEnvironment();
    await this.createInitialProject(scratchOrgEdition);
    await utilities.reloadAndEnableExtensions();
    await utilities.verifyAllExtensionsAreRunning();
    await this.authorizeDevHub();
    await this.createDefaultScratchOrg();
    utilities.log(`${this.testSuiteSuffixName} - ...finished TestSetup.setUp()`);
    utilities.log('');
  }

  public async tearDown(): Promise<void> {
    await this.checkForUncaughtErrors();
    try {
      if (this.scratchOrgAliasName) {
        // The Terminal view can be a bit unreliable, so directly call exec() instead:
        await exec(`sf org:delete:scratch --target-org ${this.scratchOrgAliasName} --no-prompt`);
      }
      await this.deleteScratchOrgInfo();
    } catch (error) {
      utilities.log(
        `Deleting scratch org (or info) failed with Error: ${(error as Error).message}`
      );
    }
  }

  private async deleteScratchOrgInfo(): Promise<void> {
    if (this.scratchOrgId) {
      const sfDataDeleteRecord = await exec(
        `sf data:delete:record --sobject ScratchOrgInfo --where ScratchOrg=${this.scratchOrgId} --target-org ${EnvironmentSettings.getInstance().devHubAliasName}`
      );
      if (!sfDataDeleteRecord.stdout.includes('Deleting Record... Success')) {
        throw new Error(
          `Deleting scratch org info failed with stderr: ${sfDataDeleteRecord.stderr}`
        );
      }
    }
  }

  private async checkForUncaughtErrors(): Promise<void> {
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.showRunningExtensions(workbench);

    // Zoom out so all the extensions are visible
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);
    const uncaughtErrors = await $$('span.codicon-bug');
    utilities.log(
      uncaughtErrors.length == 1
        ? `${uncaughtErrors.length} extension with uncaught errors was found`
        : `${uncaughtErrors.length} extensions with uncaught errors were found`
    );
    expect(uncaughtErrors.length).toBe(0);
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
      await utilities.removeFolder(this.projectFolderPath);
      await utilities.pause(1);
    }

    // Now create the temp folder.  It should exist but create the folder if it is missing.
    if (!fs.existsSync(this.tempFolderPath)) {
      await utilities.createFolder(this.tempFolderPath);
      await utilities.pause(1);
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished setUpTestingEnvironment()`);
    utilities.log('');
  }

  public async createInitialProject(scratchOrgEdition: string): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting createInitialProject()...`);

    // If you are not in a VSCode project, the Salesforce extensions are not running
    // Force the CLI integration extension to load before creating the project
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Show Running Extensions', 5);
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create Project', 5);
    await browser.keys(['Escape']);
    await utilities.pause(1);
    await browser.keys(['Escape']);

    // Do not continue until we verify CLI Integration extension is present and running
    let coreExtensionWasFound = false;
    do {
      await utilities.pause(10);

      coreExtensionWasFound = await utilities.findExtensionInRunningExtensionsList(
        workbench,
        'salesforcedx-vscode-core'
      );
    } while (coreExtensionWasFound === false);
    utilities.log(`${this.testSuiteSuffixName} - Ready to create the standard project`);

    await this.createProject(workbench, this.tempProjectName, scratchOrgEdition);

    // Extra config needed for Apex LSP on GHA
    const os = process.platform;
    if (os === 'darwin') {
      this.setJavaHomeConfigEntry();
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished createInitialProject()`);
    utilities.log('');
  }

  public async createProject(workbench: Workbench, projectName: string, scratchOrgEdition: string) {
    this.prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create Project', 5);
    // Selecting "SFDX: Create Project" causes the extension to be loaded, and this takes a while.
    // Select the "Standard" project type.
    await utilities.selectQuickPickItem(this.prompt, 'Standard');

    // Enter the project's name.
    await this.prompt.setText(projectName);
    await utilities.pause(1);

    // Press Enter/Return.
    await this.prompt.confirm();

    // Set the location of the project.
    const input = await this.prompt.input$;
    await input.setValue(this.tempFolderPath!);
    await utilities.pause(1);

    // Click the OK button.
    await utilities.clickFilePathOkButton();

    // Verify the project was created and was loaded.
    await this.verifyProjectCreated(projectName);
    this.updateScratchOrgDefWithEdition(scratchOrgEdition);
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

  private async createDefaultScratchOrg(): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting createDefaultScratchOrg()...`);

    utilities.log(`${this.testSuiteSuffixName} - calling transformedUserName()...`);
    const currentOsUserName = await utilities.transformedUserName();

    utilities.log(`${this.testSuiteSuffixName} - calling getWorkbench()...`);

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
      `sf org:create:scratch --edition developer --definition-file ${definitionFile} --alias ${this.scratchOrgAliasName} --duration-days ${durationDays} --set-default --json`
    );
    utilities.log(`${this.testSuiteSuffixName} - ..."sf org:create:scratch" finished`);

    utilities.log(`${this.testSuiteSuffixName} - calling removedEscapedCharacters()...`);
    const json = this.removedEscapedCharacters(sfOrgCreateResult.stdout);

    utilities.log(`${this.testSuiteSuffixName} - calling JSON.parse()...`);
    const result = JSON.parse(json).result;

    const endDate = Date.now();
    const time = endDate - startDate;
    utilities.log(
      `Creating ${this.scratchOrgAliasName} took ${time} ticks (${time / 1000.0} seconds)`
    );

    if (
      !result.authFields ||
      !result.authFields.accessToken ||
      !result.orgId ||
      !result.scratchOrgInfo.SignupEmail
    ) {
      throw new Error(
        `In createDefaultScratchOrg(), result is missing required fields.\nAuth Fields: ${result.authFields}\nOrg ID: ${result.orgId}\nSign Up Email: ${result.scratchOrgInfo.SignupEmail}.`
      );
    }
    this.scratchOrgId = (result.orgId as string).slice(0, -3);

    // Run SFDX: Set a Default Org
    utilities.log(`${this.testSuiteSuffixName} - selecting SFDX: Set a Default Org...`);
    this.setDefaultOrg();

    utilities.log(`${this.testSuiteSuffixName} - ...finished createDefaultScratchOrg()`);
    utilities.log('');
  }

  private async setDefaultOrg(): Promise<void> {
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Set a Default Org',
      10
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

    await utilities.pause(3);

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

  private updateScratchOrgDefWithEdition(scratchOrgEdition: string) {
    if (scratchOrgEdition === 'Enterprise') {
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
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 70);

    const sidebar = await (await workbench.getSideBar()).wait();
    const content = await (await sidebar.getContent()).wait();
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
