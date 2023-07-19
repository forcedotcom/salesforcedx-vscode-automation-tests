/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs';
import { step } from 'mocha-steps';
import path from 'path';
import { DefaultTreeItem, InputBox, QuickOpenBox } from 'wdio-vscode-service';
import { EnvironmentSettings } from '../environmentSettings';
import * as utilities from '../utilities';

describe('Authentication', async () => {
  const tempProjectName = 'TempProject-Authentication';
  let tempFolderPath: string;
  let projectFolderPath: string;
  let prompt: QuickOpenBox | InputBox;
  let scratchOrgAliasName: string;

  step('Set up the testing environment', async () => {
    tempFolderPath = getTempFolderPath();
    projectFolderPath = path.join(tempFolderPath, tempProjectName);

    // Remove the project folder, just in case there are stale files there.
    if (fs.existsSync(projectFolderPath)) {
      utilities.removeFolder(projectFolderPath);
      await utilities.pause(1);
    }

    // Now create the temp folder.  It should exist but create the folder if it is missing.
    if (!fs.existsSync(tempFolderPath)) {
      await utilities.createFolder(tempFolderPath);
      await utilities.pause(1);
    }
  });

  step('Run SFDX: Create Project', async () => {
    const workbench = await browser.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create Project', 10);
    // Selecting "SFDX: Create Project" causes the extension to be loaded, and this takes a while.

    // Select the "Standard" project type.
    const quickPicks = await prompt.getQuickPicks();
    expect(quickPicks).not.toBeUndefined();
    expect(quickPicks.length).toEqual(3);
    expect(await quickPicks[0].getLabel()).toEqual('Standard');
    expect(await quickPicks[1].getLabel()).toEqual('Empty');
    expect(await quickPicks[2].getLabel()).toEqual('Analytics');
    await prompt.selectQuickPick('Standard');
    await utilities.pause(1);

    // Enter "TempProject-Authentication" for the project name.
    await prompt.setText(tempProjectName);
    await utilities.pause(1);

    // Press Enter/Return.
    await prompt.confirm();

    // Set the location of the project.
    const input = await prompt.input$;
    await input.setValue(tempFolderPath);
    await utilities.pause(1);

    // Click the OK button.
    await utilities.clickFilePathOkButton();

    // Verify the project was created and was loaded.
    const sidebar = workbench.getSideBar();
    const content = sidebar.getContent();
    const treeViewSection = await content.getSection(tempProjectName.toUpperCase());
    expect(treeViewSection).not.toEqual(undefined);

    const forceAppTreeItem = (await treeViewSection.findItem('force-app')) as DefaultTreeItem;
    expect(forceAppTreeItem).not.toEqual(undefined);

    await forceAppTreeItem.expand();

    // Yep, we need to wait a long time here.
    await utilities.pause(10);
  });

  step('Run SFDX: Authorize a Dev Hub', async () => {
    // This is essentially the "SFDX: Authorize a Dev Hub" command, but using the CLI and an auth file instead of the UI.
    const workbench = await browser.getWorkbench();
    await utilities.pause(1);

    // In the initial state, the org picker button should be set to "No Default Org Set".
    let noDefaultOrgSetItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      'No Default Org Set'
    );
    expect(noDefaultOrgSetItem).not.toBeUndefined();

    const environmentSettings = EnvironmentSettings.getInstance();
    const authFilePath = path.join(projectFolderPath, 'authFile.json');
    const terminalView = await utilities.executeCommand(
      workbench,
      `sfdx force:org:display -u ${environmentSettings.devHubAliasName} --verbose --json > ${authFilePath}`
    );

    const authFilePathFileExists = fs.existsSync(authFilePath);
    expect(authFilePathFileExists).toEqual(true);

    await terminalView.executeCommand(`sfdx auth:sfdxurl:store -d -f ${authFilePath}`);

    const terminalText = await utilities.getTerminalViewText(terminalView, 60);
    expect(terminalText).toContain(
      `Successfully authorized ${environmentSettings.devHubUserName} with org ID`
    );

    // After a dev hub has been authorized, the org should still not be set.
    noDefaultOrgSetItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      'No Default Org Set'
    );
    expect(noDefaultOrgSetItem).not.toBeUndefined();
  });

  step('Run SFDX: Set a Default Org', async () => {
    // This is "SFDX: Set a Default Org", using the button in the status bar.
    // Could also run the command, "SFDX: Set a Default Org" but this exercises more UI elements.

    // Click on "No default Org Set" (in the bottom bar).
    const workbench = await browser.getWorkbench();
    const changeDefaultOrgSetItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      'Change Default Org'
    );
    expect(changeDefaultOrgSetItem).not.toBeUndefined();
    await changeDefaultOrgSetItem.click();
    await utilities.pause(1);

    // In the drop down menu that appears, verify the SFDX auth org commands are present...
    const expectedSfdxCommands = [
      ' SFDX: Authorize an Org',
      ' SFDX: Authorize a Dev Hub',
      ' SFDX: Create a Default Scratch Org...',
      ' SFDX: Authorize an Org using Session ID',
      ' SFDX: Remove Deleted and Expired Orgs'
    ];
    const foundSfdxCommands: string[] = [];
    const quickPicks = await prompt.getQuickPicks();
    for (const quickPick of quickPicks) {
      const label = await quickPick.getLabel();
      if (expectedSfdxCommands.includes(label)) {
        foundSfdxCommands.push(label);
      }
    }

    if (expectedSfdxCommands.length !== foundSfdxCommands.length) {
      // Something is wrong - the count of matching menus isn't what we expected.
      expectedSfdxCommands.forEach(expectedSfdxCommand => {
        expect(foundSfdxCommands).toContain(expectedSfdxCommand);
      });
    }

    // In the drop down menu that appears, select "vscodeOrg - user_name".
    const environmentSettings = EnvironmentSettings.getInstance();
    const devHubAliasName = environmentSettings.devHubAliasName;
    const devHubUserName = environmentSettings.devHubUserName;
    await utilities.selectQuickPickItem(prompt, `${devHubAliasName} - ${devHubUserName}`);

    // Need to pause here for the "set a default org" command to finish.
    await utilities.pause(5);

    // Look for the notification that appears which says, "SFDX: Set a Default Org successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Set a Default Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    const expectedOutputWasFound = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      `defaultusername  ${devHubAliasName}  true`,
      5
    );
    expect(expectedOutputWasFound).not.toBeUndefined();

    // Look for "vscodeOrg" in the status bar.
    const statusBar = workbench.getStatusBar();
    const vscodeOrgItem = await statusBar.getItem(`plug  ${devHubAliasName}, Change Default Org`);
    expect(vscodeOrgItem).not.toBeUndefined();
  });

  step('Run SFDX: Create a Default Scratch Org', async () => {
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create a Default Scratch Org...',
      1
    );

    // Select a project scratch definition file (config/project-scratch-def.json)
    // Press Enter/Return to use the default (config/project-scratch-def.json)
    await prompt.confirm();

    // Enter an org alias - yyyy-mm-dd-username-ticks
    const currentDate = new Date();
    const ticks = currentDate.getTime();
    const day = ('0' + currentDate.getDate()).slice(-2);
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const year = currentDate.getFullYear();
    const currentOsUserName = utilities.transformedUserName();
    scratchOrgAliasName = `TempScratchOrg_${year}_${month}_${day}_${currentOsUserName}_${ticks}_OrgAuth`;

    await prompt.setText(scratchOrgAliasName);
    await utilities.pause(1);

    // Press Enter/Return.
    await prompt.confirm();

    // Enter the number of days.
    await prompt.setText('1');
    await utilities.pause(1);

    // Press Enter/Return.
    await prompt.confirm();

    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Create a Default Scratch Org...',
      utilities.FIVE_MINUTES
    );

    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Create a Default Scratch Org... successfully ran'
    );
    if (successNotificationWasFound !== true) {
      const failureNotificationWasFound = await utilities.notificationIsPresent(
        workbench,
        'SFDX: Create a Default Scratch Org... failed to run'
      );
      if (failureNotificationWasFound === true) {
        if (
          await utilities.attemptToFindOutputPanelText(
            'Salesforce CLI',
            'organization has reached its daily scratch org signup limit',
            5
          )
        ) {
          // This is a known issue...
          utilities.log(
            'Warning - creating the scratch org failed, but the failure was due to the daily signup limit'
          );
        } else if (
          await utilities.attemptToFindOutputPanelText(
            'Salesforce CLI',
            'is enabled as a Dev Hub',
            5
          )
        ) {
          // This is a known issue...
          utilities.log('Warning - Make sure that the org is enabled as a Dev Hub.');
          utilities.log(
            'Warning - To enable it, open the org in your browser, navigate to the Dev Hub page in Setup, and click Enable.'
          );
          utilities.log(
            'Warning - If you still see this error after enabling the Dev Hub feature, then re-authenticate to the org.'
          );
        } else {
          // The failure notification is showing, but it's not due to maxing out the daily limit.  What to do...?
          utilities.log('Warning - creating the scratch org failed... not sure why...');
        }
      } else {
        utilities.log(
          'Warning - creating the scratch org failed... neither the success notification or the failure notification was found.'
        );
      }
    }
    expect(successNotificationWasFound).toBe(true);

    // Look for the org's alias name in the list of status bar items.
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      scratchOrgAliasName
    );
    expect(scratchOrgStatusBarItem).not.toBeUndefined();
  });

  step('Run SFDX: Set the Scratch Org As the Default Org', async () => {
    const workbench = await browser.getWorkbench();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Set a Default Org',
      1
    );

    const scratchOrgQuickPickItemWasFound = await utilities.findQuickPickItem(
      inputBox,
      scratchOrgAliasName,
      false,
      true
    );
    expect(scratchOrgQuickPickItemWasFound).toBe(true);

    await utilities.pause(3);

    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Set a Default Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Look for the org's alias name in the list of status bar items.
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      scratchOrgAliasName
    );
    expect(scratchOrgStatusBarItem).not.toBeUndefined();
  });

  step('Tear down', async () => {
    if (scratchOrgAliasName) {
      const workbench = await browser.getWorkbench();
      await utilities.executeCommand(
        workbench,
        `sfdx force:org:delete -u ${scratchOrgAliasName} --noprompt`
      );
    }

    // This used to work...
    // const tempFolderPath = getTempFolderPath();
    // if (tempFolderPath) {
    //   await utilities.removeFolder(tempFolderPath);
    // }
    // ...but something recently changed and now, removing the folder while VS Code has the folder open
    // causes VS Code to get into a funky state.  The next time a project is created, we get the
    // following error:
    //   07:45:19.65 Starting SFDX: Create Project
    //   ENOENT: no such file or directory, uv_cwd
    //
    // Not deleting the folder that was created is OK, b/c it is deleted in setUpTestingEnvironment()
    // the next time the test suite runs.  I'm going to leave this in for now in case this gets fixed
    // and this code can be added back in.
  });

  function getTempFolderPath(): string {
    return path.join(__dirname, '..', '..', 'e2e-temp');
  }
});
