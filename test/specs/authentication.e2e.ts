/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs';
import {
  step
} from 'mocha-steps';
import path from 'path';
import {
  DefaultTreeItem,
  InputBox,
  QuickOpenBox
} from 'wdio-vscode-service';
import {
  EnvironmentSettings
} from '../environmentSettings';
import * as utilities from '../utilities';

describe('Authentication', async () => {
  const tempProjectName = 'TempProject-Authentication';
  let tempFolderPath: string;
  let projectFolderPath: string;
  let prompt: QuickOpenBox | InputBox;
  let scratchOrgAliasName: string;

  step('Set up the testing environment', async () => {
    utilities.log('Authentication - Set up the testing environment');

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
    utilities.log('Authentication - Run SFDX: Create Project');

    const workbench = await utilities.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create Project', 8);
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
    utilities.log('calling clickFilePathOkButton()');
    await utilities.clickFilePathOkButton();

    // Verify the project was created and was loaded.
    utilities.log('calling workbench.getSideBar()');
    const sidebar = await workbench.getSideBar();
    utilities.log('calling sidebar.getContent()');
    const content = await sidebar.getContent();
    utilities.log('content.getSection');
    const treeViewSection = await content.getSection(tempProjectName.toUpperCase());
    expect(treeViewSection).not.toEqual(undefined);

    utilities.log('calling treeViewSection.findItem()');
    const forceAppTreeItem = await treeViewSection.findItem('force-app') as DefaultTreeItem;
    expect(forceAppTreeItem).not.toEqual(undefined);

    utilities.log('forceAppTreeItem.expand()');
    await forceAppTreeItem.expand();

    // Yep, we need to wait a long time here.
    utilities.log('all finished, calling utilities.pause(10)');
    await utilities.pause(10);
  });

  step('Run SFDX: Authorize a Dev Hub', async () => {
    utilities.log('Authentication - Run SFDX: Authorize a Dev Hub');

    // This is essentially the "SFDX: Authorize a Dev Hub" command, but using the CLI and an auth file instead of the UI.
    const workbench = await utilities.getWorkbench();
    await utilities.pause(1);

    // In the initial state, the org picker button should be set to "No Default Org Set".
    utilities.log('calling workbench.getStatusBar()');
    let statusBar = await workbench.getStatusBar();
    utilities.log('calling getStatusBarItemWhichIncludes()');
    let noDefaultOrgSetItem = await utilities.getStatusBarItemWhichIncludes(statusBar, 'No Default Org Set');
    expect(noDefaultOrgSetItem).not.toBeUndefined();

    utilities.log('calling path.join()');
    const authFilePath = path.join(projectFolderPath, 'authFile.json');

    // utilities.log('calling utilities.executeCommand()');
    // const terminalView = await utilities.executeCommand(workbench, `sfdx force:org:display -u ${EnvironmentSettings.getInstance().devHubAliasName} --verbose --json > ${authFilePath}`);
    // jab utilities.executeCommand() failed once
    // ..it might be due to needing to pause
    // ...or it might be due to needing to close all notifications
    // or it might be due to something else...
    // ...add try/catch here to try and solve this
    let terminalView;
    try {
      utilities.log('calling utilities.executeCommand()');
      terminalView = await utilities.executeCommand(workbench, `sfdx force:org:display -u ${EnvironmentSettings.getInstance().devHubAliasName} --verbose --json > ${authFilePath}`);
    } catch(err1) {
      debugger;
      // now step through this...
      // first, see if a pause here works
      try {
        await utilities.pause(1);
        terminalView = await utilities.executeCommand(workbench, `sfdx force:org:display -u ${EnvironmentSettings.getInstance().devHubAliasName} --verbose --json > ${authFilePath}`);
        debugger; // if we got to here then it's all good
      } catch(err2) {
        debugger;
        try {
          await utilities.dismissAllNotifications();
          terminalView = await utilities.executeCommand(workbench, `sfdx force:org:display -u ${EnvironmentSettings.getInstance().devHubAliasName} --verbose --json > ${authFilePath}`);
          debugger; // if we got to here then it's all good
        } catch(err3) {
          debugger;
          // well??? what else?
        }
      }
    }


    const authFilePathFileExists = fs.existsSync(authFilePath);
    expect(authFilePathFileExists).toEqual(true);

    await terminalView.executeCommand(`sfdx auth:sfdxurl:store -d -f ${authFilePath}`);

    const terminalText = await utilities.getTerminalViewText(terminalView, 60);
    expect(terminalText).toContain(`Successfully authorized ${EnvironmentSettings.getInstance().devHubUserName} with org ID`);

    // After a dev hub has been authorized, the org should still not be set.
    statusBar = workbench.getStatusBar();
    noDefaultOrgSetItem = await utilities.getStatusBarItemWhichIncludes(statusBar, 'No Default Org Set');
    expect(noDefaultOrgSetItem).not.toBeUndefined();
  });

  step('Run SFDX: Set a Default Org', async () => {
    utilities.log('Authentication - Run SFDX: Set a Default Org');

    // This is "SFDX: Set a Default Org", using the button in the status bar.
    // Could also run the command, "SFDX: Set a Default Org" but this exercises more UI elements.

    // Click on "No default Org Set" (in the bottom bar).
    const workbench = await utilities.getWorkbench();
    const statusBar = workbench.getStatusBar();
    const changeDefaultOrgSetItem = await utilities.getStatusBarItemWhichIncludes(statusBar, 'Change Default Org');
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


    // TODOx:
    // In the drop down menu that appears, select "vscodeOrg - user_name".
    // await utilities.selectQuickPickItem(prompt, `${EnvironmentSettings.getInstance().devHubAliasName} - ${EnvironmentSettings.getInstance().devHubUserName}`);


    const quickPickText = `${EnvironmentSettings.getInstance().devHubAliasName} - ${EnvironmentSettings.getInstance().devHubUserName}`;
    // Type the quick pick item to find into the filter.  Do this incase the
    // pick list item is not visible (and one needs to scroll down to see it).
    await prompt.setText(quickPickText);
    await utilities.pause(1);

    // In the drop down menu that appears, select "vscodeOrg - user_name".
    await utilities.selectQuickPickItem(prompt, quickPickText);



    // Need to pause here for the "set a default org" command to finish.
    await utilities.pause(5);

    // Look for the notification that appears which says, "SFDX: Set a Default Org successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Set a Default Org successfully ran');
    expect(successNotificationWasFound).toBe(true);

    const expectedOutputWasFound = await utilities.attemptToFindOutputPanelText('Salesforce CLI', `defaultusername  ${EnvironmentSettings.getInstance().devHubAliasName}  true`, 5);
    expect(expectedOutputWasFound).not.toBeUndefined();

    // Look for "vscodeOrg" in the status bar.
    const vscodeOrgItem = await statusBar.getItem(`plug  ${EnvironmentSettings.getInstance().devHubAliasName}, Change Default Org`);
    expect(vscodeOrgItem).not.toBeUndefined();
  });

  step('Run SFDX: Create a Default Scratch Org', async () => {
    utilities.log('Authentication - Run SFDX: Create a Default Scratch Org');

    const workbench = await utilities.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create a Default Scratch Org...', 1);

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

    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Create a Default Scratch Org...', 5 * 60);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Create a Default Scratch Org... successfully ran');
    if (successNotificationWasFound !== true) {
      const failureNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Create a Default Scratch Org... failed to run');
      if (failureNotificationWasFound === true) {
        if (await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'organization has reached its daily scratch org signup limit', 5)) {
          // This is a known issue...
          utilities.log('Warning - creating the scratch org failed, but the failure was due to the daily signup limit');
        } else if (await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'is enabled as a Dev Hub', 5)) {
          // This is a known issue...
          utilities.log('Warning - Make sure that the org is enabled as a Dev Hub.');
          utilities.log('Warning - To enable it, open the org in your browser, navigate to the Dev Hub page in Setup, and click Enable.');
          utilities.log('Warning - If you still see this error after enabling the Dev Hub feature, then re-authenticate to the org.');
        } else {
          // The failure notification is showing, but it's not due to maxing out the daily limit.  What to do...?
          utilities.log('Warning - creating the scratch org failed... not sure why...');
        }
      } else {
        utilities.log('Warning - creating the scratch org failed... neither the success notification or the failure notification was found.');
      }
    }
    expect(successNotificationWasFound).toBe(true);

    // Look for orgAliasName in the list of status bar items.
    const statusBar = await workbench.getStatusBar();
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(statusBar, scratchOrgAliasName);
    expect(scratchOrgStatusBarItem).not.toBeUndefined();
  });

  step('Run SFDX: Set the Scratch Org As the Default Org', async () => {
    utilities.log('Authentication - Run SFDX: Set the Scratch Org As the Default Org');

    const workbench = await utilities.getWorkbench();
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Set a Default Org', 1);

    // TODOx:
    await inputBox.setText(scratchOrgAliasName);
    await utilities.pause(1);

    let scratchOrgQuickPickItemWasFound = false;
    const quickPicks = await inputBox.getQuickPicks();
    for (const quickPick of quickPicks) {
      const label = await quickPick.getLabel();
      if (scratchOrgAliasName) {
        // Find the org that was created in the "Run SFDX: Create a Default Scratch Org" step.
        if (label.includes(scratchOrgAliasName)) {
          await quickPick.select();
          await utilities.pause(3);
          scratchOrgQuickPickItemWasFound = true;
          break;
        }
      }
    }
    expect(scratchOrgQuickPickItemWasFound).toBe(true);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Set a Default Org successfully ran');
    expect(successNotificationWasFound).toBe(true);

    // Look for orgAliasName in the list of status bar items.
    const statusBar = await workbench.getStatusBar();
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(statusBar, scratchOrgAliasName);
    expect(scratchOrgStatusBarItem).not.toBeUndefined();
  });

  step('Tear down', async () => {
    utilities.log('Authentication - Tear down');

    if (scratchOrgAliasName) {
      const workbench = await utilities.getWorkbench();
      await utilities.executeCommand(workbench, `sfdx force:org:delete -u ${scratchOrgAliasName} --noprompt`);
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
