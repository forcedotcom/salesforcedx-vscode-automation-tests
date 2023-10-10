/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import child_process from 'child_process';
import fs from 'fs';
import { step } from 'mocha-steps';
import path from 'path';
import util from 'util';
import { TextEditor } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

const exec = util.promisify(child_process.exec);

describe('Push and Pull', async () => {
  let testSetup: TestSetup;
  let projectName = '';
  let adminName = '';
  let adminEmailAddress = '';

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('PushAndPull', false);
    await testSetup.setUp('Enterprise');
    projectName = testSetup.tempProjectName.toUpperCase();
  });

  step('Create an Apex class', async () => {
    // Create an Apex Class.
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Apex Class',
      1
    );

    // Set the name of the new component to ExampleApexClass1.
    await inputBox.setText('ExampleApexClass1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Create Apex Class successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Apex Class',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain(
      `create ${path.join('force-app', 'main', 'default', 'classes', 'ExampleApexClass1.cls')}`
    );
    expect(outputPanelText).toContain(
      `create ${path.join(
        'force-app',
        'main',
        'default',
        'classes',
        'ExampleApexClass1.cls-meta.xml'
      )}`
    );

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Get the matching (visible) items within the tree which contain "ExampleApexClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ExampleApexClass1'
    );

    // It's a tree, but it's also a list.  Everything in the view is actually flat
    // and returned from the call to visibleItems.reduce().
    expect(filteredTreeViewItems.includes('ExampleApexClass1.cls')).toBe(true);
    expect(filteredTreeViewItems.includes('ExampleApexClass1.cls-meta.xml')).toBe(true);
  });

  step('Push the Apex class', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Org', 5);

    // At this point there should be no conflicts since this is a new class.

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pushed Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Created  ExampleApexClass1  ApexClass');
  });

  step('Push again (with no changes)', async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Org', 5);

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pushed Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');
  });

  step('Modify the file and push the changes', async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // Modify the file by adding a comment.
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('ExampleApexClass1.cls')) as TextEditor;
    await textEditor.setTextAtLine(3, '        // sample comment');

    // Push the file.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Org', 5);

    let successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    let outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pushed Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');

    // Clear the Output view again.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // Now save the file.
    await textEditor.save();

    // An now push the changes.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Org', 5);

    successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pushed Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('ended with exit code 0');
    expect(outputPanelText).toContain('Changed  ExampleApexClass1  ApexClass');
    expect(outputPanelText).toContain(
      path.join(
        'e2e-temp',
        'TempProject-PushAndPull',
        'force-app',
        'main',
        'default',
        'classes',
        'ExampleApexClass1.cls'
      )
    );
    expect(outputPanelText).toContain(
      path.join(
        'e2e-temp',
        'TempProject-PushAndPull',
        'force-app',
        'main',
        'default',
        'classes',
        'ExampleApexClass1.cls-meta.xml'
      )
    );
  });

  step('Pull the Apex class', async () => {
    // With this test, it's going to pull twice...
    const workbench = await (await browser.getWorkbench()).wait();

    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Pull Source from Default Org', 5);

    // At this point there should be no conflicts since there have been no changes.

    let successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Pull Source from Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    let outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pulled Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    // The first time a pull is performed, force-app/main/default/profiles/Admin.profile-meta.xml is pulled down.
    expect(outputPanelText).toContain('Created  Admin');
    expect(outputPanelText).toContain(
      path.join('force-app', 'main', 'default', 'profiles', 'Admin.profile-meta.xml')
    );
    expect(outputPanelText).toContain('ended with exit code 0');

    // Second pull...
    // Clear the output again.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // And pull again.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Pull Source from Default Org', 5);

    successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Pull Source from Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pulled Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');
    expect(outputPanelText).toContain('ended with exit code 0');
    expect(outputPanelText).not.toContain('Created  Admin');
  });

  step("Modify the file (but don't save), then pull", async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    // Clear the Output view first.
    const outputView = await utilities.openOutputView();

    // Modify the file by adding a comment.
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('ExampleApexClass1.cls')) as TextEditor;
    await textEditor.setTextAtLine(3, '        // sample comment for the pull test');
    // Don't save the file just yet.

    // Pull the file.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Pull Source from Default Org', 5);

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Pull Source from Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pulled Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');
    expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Save the modified file, then pull', async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // Now save the file.
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('ExampleApexClass1.cls')) as TextEditor;
    await textEditor.save();

    // An now pull the changes.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Pull Source from Default Org', 5);

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Pull Source from Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      '=== Pulled Source',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('No results found');
    expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Create an additional system admin user', async () => {
    // Org alias format: AdminUser_yyyy_mm_dd_username_ticks__PushAndPull
    const currentDate = new Date();
    const ticks = currentDate.getTime();
    const day = ('0' + currentDate.getDate()).slice(-2);
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const year = currentDate.getFullYear();
    const currentOsUserName = await utilities.transformedUserName();
    adminName = `AdminUser_${year}_${month}_${day}_${currentOsUserName}_${ticks}_PushAndPull`;
    adminEmailAddress = `${adminName}@sfdx.org`;
    utilities.log(`PushAndPull - admin alias is ${adminName}...`);

    const systemAdminUserDef = {
      Email: adminEmailAddress,
      Username: adminEmailAddress,
      LastName: adminName,
      LocaleSidKey: 'en_US',
      EmailEncodingKey: 'UTF-8',
      LanguageLocaleKey: 'en_US',
      profileName: 'System Administrator',
      generatePassword: false
    };

    const systemAdminUserDefPath = path.join(
      testSetup.projectFolderPath!,
      'config',
      'system-admin-user-def.json'
    );
    fs.writeFileSync(systemAdminUserDefPath, JSON.stringify(systemAdminUserDef), 'utf8');

    const sfdxForceOrgCreateResult = await exec(
      `sfdx force:user:create --definitionfile ${systemAdminUserDefPath}`
    );
    expect(sfdxForceOrgCreateResult.stdout).toContain(
      `Successfully created user "${adminEmailAddress}"`
    );
  });

  step('Set the 2nd user as the default user', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Set a Default Org',
      1
    );
    const scratchOrgQuickPickItemWasFound = await utilities.findQuickPickItem(
      inputBox,
      adminEmailAddress,
      false,
      true
    );
    if (!scratchOrgQuickPickItemWasFound) {
      throw new Error(`${adminEmailAddress} was not found in the the scratch org pick list`);
    }

    await utilities.pause(3);

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

    // Look for adminEmailAddress in the list of status bar items.
    const scratchOrgStatusBarItem = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      adminEmailAddress
    );
    if (!scratchOrgStatusBarItem) {
      throw new Error(
        'getStatusBarItemWhichIncludes() returned a scratchOrgStatusBarItem with a value of null (or undefined)'
      );
    }
  });

  // TODO: at this point write e2e tests for conflict detection
  // but there's a bug - when the 2nd user is created the code thinks
  // it's a source tracked org and push & pull are no longer available
  // (yet deploy & retrieve are).  Spoke with Ken and we think this will
  // be fixed with the check in of his PR this week.

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
