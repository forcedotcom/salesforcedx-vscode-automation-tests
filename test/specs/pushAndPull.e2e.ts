/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import child_process from 'child_process';
import fs from 'fs';
import { step, xstep } from 'mocha-steps';
import path from 'path';
import util from 'util';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import { Workbench } from 'wdio-vscode-service';

const exec = util.promisify(child_process.exec);

describe('Push and Pull', async () => {
  let testSetup: TestSetup;
  let projectName = '';
  let adminName = '';
  let adminEmailAddress = '';

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('PushAndPull', false);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();
  });

  step('SFDX: View All Changes (Local and in Default Org)', async () => {
    await utilities.executeQuickPick(
      'SFDX: View All Changes (Local and in Default Org)',
      5
    );

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      `Salesforce CLI`,
      `Source Status`,
      10
    );

    expect(outputPanelText).toContain('No local or remote changes found');
  });

  step('Create an Apex class', async () => {
    // Create an Apex Class.
    const workbench = await utilities.getWorkbench();
    // Using the Command palette, run SFDX: Create Apex Class.
    await utilities.createCommand('Apex Class', 'ExampleApexClass1', 'classes', 'cls');

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

  step('SFDX: View Local Changes', async () => {
    await utilities.executeQuickPick('SFDX: View Local Changes', 5);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      `Salesforce CLI`,
      `Source Status`,
      10
    );

    expect(outputPanelText).toContain(
      `Local Add  ExampleApexClass1  ApexClass  ${path.join(
        'force-app',
        'main',
        'default',
        'classes',
        'ExampleApexClass1.cls'
      )}`
    );
    expect(outputPanelText).toContain(
      `Local Add  ExampleApexClass1  ApexClass  ${path.join(
        'force-app',
        'main',
        'default',
        'classes',
        'ExampleApexClass1.cls-meta.xml'
      )}`
    );
  });

  step('Push the Apex class', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('SFDX: Push Source to Default Org', 5);

    // At this point there should be no conflicts since this is a new class.
    // Check the output.
    await verifyPushAndPullOutputText(workbench, 'Push', 'to', 'Created');
  });

  step('Push again (with no changes)', async () => {
    // Clear the Output view first.
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('View: Clear Output', 2);

    // Now push
    await utilities.executeQuickPick('SFDX: Push Source to Default Org', 5);

    // Check the output.
    await verifyPushAndPullOutputText(workbench, 'Push', 'to');
  });

  step('Modify the file and push the changes', async () => {
    const workbench = await utilities.getWorkbench();

    // Clear the Output view first.
    await utilities.executeQuickPick('View: Clear Output', 2);

    // Modify the file by adding a comment.
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleApexClass1.cls');
    await textEditor.setTextAtLine(3, '        // sample comment');

    // Push the file.
    await utilities.executeQuickPick('SFDX: Push Source to Default Org', 5);

    await verifyPushAndPullOutputText(workbench, 'Push', 'to');

    // Clear the Output view again.
    await utilities.executeQuickPick('View: Clear Output', 2);

    // Now save the file.
    await textEditor.save();

    // An now push the changes.
    await utilities.executeQuickPick('SFDX: Push Source to Default Org', 5);

    // Check the output.
    const outputPanelText = await verifyPushAndPullOutputText(workbench, 'Push', 'to', 'Changed');
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
    const workbench = await utilities.getWorkbench();

    // Clear the Output view first.
    await utilities.executeQuickPick('View: Clear Output', 2);

    await utilities.executeQuickPick('SFDX: Pull Source from Default Org', 5);

    // Check the output.
    let outputPanelText = await verifyPushAndPullOutputText(workbench, 'Pull', 'from', 'Created');
    // The first time a pull is performed, force-app/main/default/profiles/Admin.profile-meta.xml is pulled down.
    expect(outputPanelText).toContain(
      path.join('force-app', 'main', 'default', 'profiles', 'Admin.profile-meta.xml')
    );

    // Second pull...
    // Clear the output again.
    await utilities.executeQuickPick('View: Clear Output', 2);

    // And pull again.
    await utilities.executeQuickPick('SFDX: Pull Source from Default Org', 5);

    // Check the output.
    outputPanelText = await verifyPushAndPullOutputText(workbench, 'Pull', 'from');
    expect(outputPanelText).not.toContain('Created  Admin');
  });

  step("Modify the file (but don't save), then pull", async () => {
    const workbench = await utilities.getWorkbench();

    // Clear the Output view first.
    await utilities.executeQuickPick('View: Clear Output', 2);

    // Modify the file by adding a comment.
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleApexClass1.cls');
    await textEditor.setTextAtLine(3, '        // sample comment for the pull test');
    // Don't save the file just yet.

    // Pull the file.
    await utilities.executeQuickPick('SFDX: Pull Source from Default Org', 5);

    // Check the output.
    await verifyPushAndPullOutputText(workbench, 'Pull', 'from');
  });

  step('Save the modified file, then pull', async () => {
    const workbench = await utilities.getWorkbench();

    // Clear the Output view first.
    await utilities.executeQuickPick('View: Clear Output', 2);

    // Now save the file.
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleApexClass1.cls');
    await textEditor.save();

    // An now pull the changes.
    await utilities.executeQuickPick('SFDX: Pull Source from Default Org', 5);

    await verifyPushAndPullOutputText(workbench, 'Pull', 'from');
  });

  step('SFDX: View Changes in Default Org', async () => {
    // Create second Project to then view Remote Changes
    await testSetup.createProject('developer', 'ViewChanges');

    // Verify CLI Integration Extension is present and running.
    await utilities.reloadAndEnableExtensions();
    await utilities.showRunningExtensions();
    const extensionWasFound = await utilities.verifyExtensionsAreRunning(
      utilities.getExtensionsToVerifyActive((ext) => ext.extensionId === 'salesforcedx-vscode-core')
    );
    expect(extensionWasFound).toBe(true);

    //Run SFDX: View Changes in Default Org command to view remote changes
    await utilities.executeQuickPick('SFDX: View Changes in Default Org', 5);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      `Salesforce CLI`,
      `Source Status`,
      10
    );

    expect(outputPanelText).toContain(`Remote Add  ExampleApexClass1  ApexClass`);
  });

  xstep('Create an additional system admin user', async () => {
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

    const sfOrgCreateUserResult = await exec(
      `sf org:create:user --definition-file ${systemAdminUserDefPath} --target-org ${testSetup.scratchOrgAliasName}`
    );
    expect(sfOrgCreateUserResult.stdout).toContain(
      `Successfully created user "${adminEmailAddress}"`
    );
  });

  xstep('Set the 2nd user as the default user', async () => {
    const workbench = await utilities.getWorkbench();
    const inputBox = await utilities.executeQuickPick('SFDX: Set a Default Org', 10);
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

  /**
   * @param operation identifies if it's a pull or push operation
   * @param fromTo indicates if changes are coming from or going to the org
   * @param type indicates if the metadata is expected to have been created, changed or deleted
   * @returns the output panel text after
   */
  const verifyPushAndPullOutputText = async (
    workbench: Workbench,
    operation: string,
    fromTo: string,
    type?: string
  ): Promise<string | undefined> => {
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      `SFDX: ${operation} Source ${fromTo} Default Org successfully ran`,
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);
    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      `Salesforce CLI`,
      `=== ${operation}ed Source`,
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    if (type) {
      if (operation === 'Push') {
        expect(outputPanelText).toContain(`${type}  ExampleApexClass1  ApexClass`);
      } else {
        expect(outputPanelText).toContain(`${type}  Admin`);
      }
    } else {
      expect(outputPanelText).toContain('No results found');
    }
    expect(outputPanelText).toContain('ended with exit code 0');
    return outputPanelText;
  };
});
