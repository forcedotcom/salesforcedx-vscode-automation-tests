/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs';
import path from 'path';
import { DefaultTreeItem, InputBox, QuickOpenBox, Workbench } from 'wdio-vscode-service';
import { EnvironmentSettings } from './environmentSettings';
import * as utilities from './utilities';
import { AuthInfo, Org, scratchOrgCreate } from '@salesforce/core';
import { HrTime } from './utilities/hrTime';

export class TestSetup {
  public testSuiteSuffixName: string;
  private reuseScratchOrg = false;
  private static aliasAndUserNameWereVerified = false;
  public tempFolderPath: string | undefined = undefined;
  protected _projectFolderPath: string | undefined = undefined;
  private prompt: QuickOpenBox | InputBox | undefined;
  private scratchOrgAliasName: string | undefined;

  public constructor(
    testSuiteSuffixName: string,
    reuseScratchOrg: boolean
  ) {
    this.testSuiteSuffixName = testSuiteSuffixName;
    this.reuseScratchOrg = reuseScratchOrg;
  }

  public get tempProjectName(): string {
    return 'TempProject-' + this.testSuiteSuffixName;
  }

  public get projectFolderPath(): string | undefined {
    return this._projectFolderPath;
  }
  public set projectFolderPath(value: string | undefined) {
    throw new Error('To define the project folder path in TestSetup, use method createProject() instead.');
  }

  public async setUp(scratchOrgEdition: string = 'Developer'): Promise<void> {
    await this.setUpTestingEnvironment();
    await this.createProject();
    await this.authorizeDevHub();
    await this.createDefaultScratchOrg(scratchOrgEdition);
  }

  public async tearDown(): Promise<void> {
    if (this.scratchOrgAliasName && !this.reuseScratchOrg) {
      // To use VS Code's Terminal view to delete the scratch org, use:
      // const workbench = await (await browser.getWorkbench()).wait();
      // await utilities.executeCommand(workbench, `sfdx force:org:delete -u ${this.scratchOrgAliasName} --noprompt`);

      // The Terminal view can be a bit unreliable, so directly org.delete() instead:
      const org = await Org.create({ aliasOrUsername: this.scratchOrgAliasName });
      await org.delete();
    }

  }

  public async setUpTestingEnvironment(): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting setUpTestingEnvironment()...`);

    this.tempFolderPath = path.join(__dirname, '..', 'e2e-temp');
    this.projectFolderPath = path.join(this.tempFolderPath, this.tempProjectName);

    utilities.log(`${this.testSuiteSuffixName} - creating project files in ${this.projectFolderPath}`);

    // Remove the project folder, just in case there are stale files there.
    await this.removeProject();

    // Now create the temp folder.  It should exist but create the folder if it is missing.
    if (!fs.existsSync(this.tempFolderPath)) {
      await utilities.createFolder(this.tempFolderPath);
      await utilities.pause(1);
    }

    utilities.log(`${this.testSuiteSuffixName} - ...finished setUpTestingEnvironment()`);
    utilities.log('');
  }

  public async createProject(): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting createProject()...`);

    const workbench = await browser.getWorkbench();
    this.prompt = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Project',
      10
    );
    // Selecting "SFDX: Create Project" causes the extension to be loaded, and this takes a while.

    // Select the "Standard" project type.
    await utilities.selectQuickPickWithText(this.prompt, 'Standard');

    // Enter the project's name.
    await this.prompt.setText(this.tempProjectName);
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
    const sidebar = await workbench.getSideBar();
    const content = await sidebar.getContent();
    const treeViewSection = await content.getSection(this.tempProjectName.toUpperCase());
    if (!treeViewSection) {
      throw new Error(
        'In createProject(), getSection() returned a treeViewSection with a value of null (or undefined)'
      );
    }

    const forceAppTreeItem = (await treeViewSection.findItem('force-app')) as DefaultTreeItem;
    if (!forceAppTreeItem) {
      throw new Error(
        'In createProject(), findItem() returned a forceAppTreeItem with a value of null (or undefined)'
      );
    }

    await forceAppTreeItem.expand();

    // Yep, we need to wait a long time here.
    await utilities.pause(10);

    utilities.log(`${this.testSuiteSuffixName} - ...finished createProject()`);
    utilities.log('');
  }

  public async authorizeDevHub(): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting authorizeDevHub()...`);

    // This is essentially the "SFDX: Authorize a Dev Hub" command, but using the CLI and an auth file instead of the UI.
    const devHubSfdxAuthUrl = EnvironmentSettings.getInstance().devHubSfdxAuthUrl;
    if (!devHubSfdxAuthUrl) {
      throw new Error('Error: devHubSfdxAuthUrl was not set.');
    }

    // Create the auth file.
    const authFilePath = path.join(this.projectFolderPath!, 'authFile.json');
    fs.writeFileSync(authFilePath, devHubSfdxAuthUrl!, 'utf8');
    utilities.log(`${this.testSuiteSuffixName} - finished writing the auth url file...`);

    // Authorize the dev hub using authUrl
    utilities.log(`${this.testSuiteSuffixName} - authenticating the dev hub usng sfdx-url...`);

    const oauth2Options = AuthInfo.parseSfdxAuthUrl(authFilePath);
    const authInfo = await AuthInfo.create({ oauth2Options });
    await authInfo.save();

    await authInfo.handleAliasAndDefaultSettings({
      alias: undefined,
      setDefault: false,
      setDefaultDevHub: true,
    });

    const org = await Org.create({ aliasOrUsername: EnvironmentSettings.getInstance().devHubUserName });

    utilities.log(`${this.testSuiteSuffixName} - ...finished authorizeDevHub()`);
    utilities.log('');
  }

  public async createDefaultScratchOrg(scratchOrgEdition = 'Developer'): Promise<void> {
    utilities.log('');
    utilities.log(`${this.testSuiteSuffixName} - Starting createDefaultScratchOrg()...`);

    utilities.log(`${this.testSuiteSuffixName} - calling transformedUserName()...`);
    const currentOsUserName = await utilities.transformedUserName();

    utilities.log(`${this.testSuiteSuffixName} - calling getWorkbench()...`);
    const workbench = await browser.getWorkbench();

    if (this.reuseScratchOrg) {
      utilities.log(`${this.testSuiteSuffixName} - looking for a scratch org to reuse...`);

      const alias = (await AuthInfo
        .listAllAuthorizations(orgAuth => ((orgAuth.isScratchOrg ?? false) &&
          (!orgAuth.isExpired ?? false) &&
          (orgAuth.aliases ?? []).length > 0)))
        .flatMap(authInfo => authInfo.aliases)
        .find(alias => {
          alias &&
            alias.includes('TempScratchOrg_') &&
            alias.includes(currentOsUserName) &&
            alias.includes(this.testSuiteSuffixName);
        });

      if (alias) {
        this.scratchOrgAliasName = alias;

        // Set the current scratch org.
        await this.setDefaultOrg(workbench);

        utilities.log(`${this.testSuiteSuffixName} - found one: ${this.scratchOrgAliasName}`);
        utilities.log(`${this.testSuiteSuffixName} - ...finished createDefaultScratchOrg()`);
        utilities.log('');
        return;
      }
    }

    utilities.log(`${this.testSuiteSuffixName} - calling path.join()...`);
    const definitionFile = path.join(this.projectFolderPath!, 'config', 'project-scratch-def.json');

    utilities.log(`${this.testSuiteSuffixName} - constructing scratchOrgAliasName...`);
    // Org alias format: TempScratchOrg_yyyy_mm_dd_username_ticks_testSuiteSuffixName
    const currentDate = new Date();
    const ticks = currentDate.getTime();
    this.scratchOrgAliasName = `TempScratchOrg_${utilities.dateAsY_M_D(currentDate)}_${currentOsUserName}_${ticks}_${this.testSuiteSuffixName}`;
    utilities.log(
      `${this.testSuiteSuffixName} - temporary scratch org name is ${this.scratchOrgAliasName}...`
    );

    const startTime = new HrTime()

    utilities.log(`${this.testSuiteSuffixName} - calling "sfdx force:org:create"...`);

    const hubOrg = await Org.create({ aliasOrUsername: EnvironmentSettings.getInstance().devHubUserName });

    // set definition file
    const projectScratchDefPath = path.join(
      this.tempFolderPath!,
      this.tempProjectName,
      'config',
      'project-scratch-def.json'
    );

    let projectScratchDef = JSON.parse(fs.readFileSync(projectScratchDefPath, 'utf8')) as Record<string, unknown>;

    projectScratchDef = {
      ...projectScratchDef,
      edition: scratchOrgEdition,
    };

    fs.writeFileSync(projectScratchDefPath, JSON.stringify(projectScratchDef, undefined, 2), 'utf8');

    const scratchOrg = await scratchOrgCreate({
      hubOrg: hubOrg,
      alias: this.scratchOrgAliasName,
      setDefault: true,
      definitionfile: projectScratchDefPath,
      durationDays: 1
    });

    utilities.log(`${this.testSuiteSuffixName} - ..."sfdx force:org:create" finished`);
    const elapsedTime = startTime.getElapsedMilliseconds();

    utilities.log(
      `Creating ${this.scratchOrgAliasName} took ${startTime.getElapsedMilliseconds().toFixed(0)} ticks (${startTime.getElapsedSeconds().toFixed(3)} seconds)`
    );

    // Run SFDX: Set a Default Org
    utilities.log(`${this.testSuiteSuffixName} - selecting SFDX: Set a Default Org...`);
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Set a Default Org',
      1
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

    await utilities.pause(3);

    // Warning! This only works if the item (the scratch org) is visible.
    // If there are many scratch orgs, not all of them may be displayed.
    // If lots of scratch orgs are created and aren't deleted, this can
    // result in this list growing one not being able to find the org
    // they are looking for.

    // Look for the success notification.
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Set a Default Org successfully ran'
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

  protected async removeProject(): Promise<void> {
    // This used to work...

    // Not deleting the folder that was created is OK, b/c it is deleted in setUpTestingEnvironment()
    // the next time the test suite runs.  I'm going to leave this in for now in case this gets fixed
    // and this code can be added back in.

    if (this.projectFolderPath) {
      await utilities.removeFolder(this.projectFolderPath);
      await utilities.pause(1);
    }
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

    const nonScratchOrgs = await AuthInfo.listAllAuthorizations(org => !org.isScratchOrg);

    if (!nonScratchOrgs.some(so => devHubAliasName in (so.aliases ?? []) && so.username === devHubUserName)) {
      throw new Error(
        `Error: matching devHub alias '${devHubAliasName}' and devHub user name '${devHubUserName}' was not found.  Please consult README.md and make sure DEV_HUB_ALIAS_NAME and DEV_HUB_USER_NAME are set correctly.`
      );
    }
  }

  private async setDefaultOrg(workbench: Workbench): Promise<void> {
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Set a Default Org',
      2
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

    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Set a Default Org successfully ran'
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
}

