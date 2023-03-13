/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import child_process from 'child_process';
import fs from 'fs';
import {
  step
} from 'mocha-steps';
import path from 'path';
import util from 'util';
import {
  TextEditor
} from 'wdio-vscode-service';
import {
  ScratchOrg
} from '../scratchOrg';
import * as utilities from '../utilities';

const exec = util.promisify(child_process.exec);

describe('Push and Pull', async () => {
  let scratchOrg: ScratchOrg;
  let projectName = '';
  let adminName = '';
  let adminEmailAddress = '';

  step('Set up the testing environment', async () => {
    scratchOrg = new ScratchOrg('PushAndPull', false);
    await scratchOrg.setUp('Enterprise');
    projectName = scratchOrg.tempProjectName.toUpperCase();
  });

  step('Create an Apex class', async () => {
    // Create an Apex Class.
    const workbench = await browser.getWorkbench();
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create Apex Class', 1);

    // Set the name of the new component to ExampleApexClass1.
    await inputBox.setText('ExampleApexClass1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Create Apex Class successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'Finished SFDX: Create Apex Class', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('create force-app/main/default/classes/ExampleApexClass1.cls');
    expect(outputPanelText).toContain('create force-app/main/default/classes/ExampleApexClass1.cls-meta.xml');

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Get the matching (visible) items within the tree which contain "ExampleApexClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(workbench, projectName, 'ExampleApexClass1');

    // It's a tree, but it's also a list.  Everything in the view is actually flat
    // and returned from the call to visibleItems.reduce().
    expect(filteredTreeViewItems.includes('ExampleApexClass1.cls')).toBe(true);
    expect(filteredTreeViewItems.includes('ExampleApexClass1.cls-meta.xml')).toBe(true);
  });

  step('Push the Apex class', async () => {
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    // At this point there should be no conflicts since this is a new class.

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Created  ExampleApexClass1  ApexClass');
  });

  step('Push again (with no changes)', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Pushed Source\nNo results found');
  });

  step('Modify the file and push the changes', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Modify the file by adding a comment.
    const workbench = await browser.getWorkbench();
    const editorView = await workbench.getEditorView();
    const textEditor = await editorView.openEditor('ExampleApexClass1.cls') as TextEditor;
    await textEditor.setTextAtLine(3, '        // sample comment');

    // Push the file.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    let successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    let outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Pushed Source\nNo results found');

    // Clear the Output view again.
    await outputView.clearText();

    // Now save the file.
    await textEditor.save();

    // An now push the changes.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('ended with exit code 0');
    expect(outputPanelText).toContain('Changed  ExampleApexClass1  ApexClass');
    expect(outputPanelText).toContain('/e2e-temp/TempProject-PushAndPull/force-app/main/default/classes/ExampleApexClass1.cls');
    expect(outputPanelText).toContain('/e2e-temp/TempProject-PushAndPull/force-app/main/default/classes/ExampleApexClass1.cls-meta.xml');
  });

  step('Pull the Apex class', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Pull Source from Default Scratch Org', 5);

    // At this point there should be no conflicts since there have been no changes.

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Pull Source from Default Scratch Org', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Retrieved Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');
    expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Modify the file (but don\'t save), then pull', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Modify the file by adding a comment.
    const workbench = await browser.getWorkbench();
    const editorView = await workbench.getEditorView();
    const textEditor = await editorView.openEditor('ExampleApexClass1.cls') as TextEditor;
    await textEditor.setTextAtLine(3, '        // sample comment for the pull test');
    // Don't save the file just yet.

    // Pull the file.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Pull Source from Default Scratch Org', 5);

    let successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Pull Source from Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Retrieved Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');
    expect(outputPanelText).toContain('ended with exit code 0');

    // TODO: Need to check with Ananya that this is expected
  });

  step('Save the modified file, then pull', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Now save the file.
    const workbench = await browser.getWorkbench();
    const editorView = await workbench.getEditorView();
    const textEditor = await editorView.openEditor('ExampleApexClass1.cls') as TextEditor;
    await textEditor.save();

    // An now pull the changes.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Pull Source from Default Scratch Org', 5);

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Pull Source from Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Retrieved Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');
    expect(outputPanelText).toContain('ended with exit code 0');

    // TODO: Need to check with Ananya that this is expected
  });

  step('Create an additional system admin user', async () => {
    // Org alias format: AdminUser_yyyy_mm_dd_username_ticks__PushAndPull
    const currentDate = new Date();
    const ticks = currentDate.getTime();
    const day = ('0' + currentDate.getDate()).slice(-2);
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const year = currentDate.getFullYear();
    const currentOsUserName = await utilities.currentOsUserName();
    adminName = `AdminUser_${year}_${month}_${day}_${currentOsUserName}_${ticks}_PushAndPull`;
    adminEmailAddress = `${adminName}@sfdx.org`;
    utilities.log(`PushAndPull - admin alias is ${adminName}...`);

    const systemAdminUserDef = {
      'Email': adminEmailAddress,
      'Username': adminEmailAddress,
      'LastName': adminName,
      'LocaleSidKey': 'en_US',
      'EmailEncodingKey': 'UTF-8',
      'LanguageLocaleKey': 'en_US',
      'profileName': 'System Administrator',
      'generatePassword': false
    };

    const systemAdminUserDefPath = path.join(scratchOrg.projectFolderPath!, 'config', 'system-admin-user-def.json');
    fs.writeFileSync(systemAdminUserDefPath, JSON.stringify(systemAdminUserDef), 'utf8');

    const sfdxForceOrgCreateResult = await exec(`sfdx force:user:create --definitionfile ${systemAdminUserDefPath}`);
    expect(sfdxForceOrgCreateResult.stdout).toContain(`Successfully created user "${adminEmailAddress}"`);
  });

  step('Set the 2nd user as the default user', async () => {
    const workbench = await browser.getWorkbench();
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Set a Default Org', 1);

    // Select this.scratchOrgAliasName from the list.
    let scratchOrgQuickPickItemWasFound = false;
    const quickPicks = await inputBox.getQuickPicks();
    for (const quickPick of quickPicks) {
      const label = await quickPick.getLabel();
      // Find the org that was created.
      if (label.includes(adminEmailAddress)) {
        await quickPick.select();
        await utilities.pause(3);
        scratchOrgQuickPickItemWasFound = true;
        break;
      }
    }

    if (!scratchOrgQuickPickItemWasFound) {
      throw new Error(`${adminEmailAddress} was not found in the the scratch org pick list`);
    }
    // Warning! This only works if the item (the scratch org) is visible.
    // If there are many scratch orgs, not all of them may be displayed.
    // If lots of scratch orgs are created and aren't deleted, this can
    // result in this list growing one not being able to find the org
    // they are looking for.

    // Look for the success notification.
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Set a Default Org successfully ran');
    if (!successNotificationWasFound) {
      throw new Error('In createDefaultScratchOrg(), the notification of "SFDX: Set a Default Org successfully ran" was not found');
    }

    // Look for adminEmailAddress in the list of status bar items.
    const statusBar = await workbench.getStatusBar();
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(statusBar, adminEmailAddress);
    if (!scratchOrgStatusBarItem) {
      throw new Error('getStatusBarItemWhichIncludes() returned a scratchOrgStatusBarItem with a value of null (or undefined)');
    }
  });

  // TODO: at this point write e2e tests for conflict detection
  // but there's a bug - when the 2nd user is created the code thinks
  // it's a source tracked org and push & pull are no longer available
  // (yet deploy & retrieve are).  Spoke with Ken and we think this will
  // be fixed with the check in of his PR this week.


  step('Tear down and clean up the testing environment', async () => {
    await scratchOrg.tearDown();
  });
});
