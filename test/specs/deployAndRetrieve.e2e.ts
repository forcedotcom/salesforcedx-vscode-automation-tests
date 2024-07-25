/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import path from 'path';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import { Workbench } from 'wdio-vscode-service';
import { WORKSPACE_SETTING_KEYS as WSK } from '../utilities/index.ts';

describe('Deploy and Retrieve', async () => {
  let testSetup: TestSetup;
  let projectName: string;
  const pathToClass = path.join('force-app', 'main', 'default', 'classes', 'MyClass');

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('DeployAndRetrieve');
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();

    // Create Apex Class
    const classText = [
      `public with sharing class MyClass {`,
      ``,
      `\tpublic static void SayHello(string name){`,
      `\t\tSystem.debug('Hello, ' + name + '!');`,
      `\t}`,
      `}`
    ].join('\n');
    await utilities.createApexClass('MyClass', classText);
    const workbench = await utilities.getWorkbench();
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Create Apex Class successfully ran',
      utilities.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Apex Class',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain(`${pathToClass}.cls`);
    await expect(outputPanelText).toContain(`${pathToClass}.cls-meta.xml`);

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Get the matching (visible) items within the tree which contain "MyClass".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'MyClass'
    );

    // It's a tree, but it's also a list.  Everything in the view is actually flat
    // and returned from the call to visibleItems.reduce().
    await expect(filteredTreeViewItems.includes('MyClass.cls')).toBe(true);
    await expect(filteredTreeViewItems.includes('MyClass.cls-meta.xml')).toBe(true);
  });

  step('Verify Source Tracking Setting is enabled', async () => {
    expect(
      await utilities.isBooleanSettingEnabled(WSK.ENABLE_SOURCE_TRACKING_FOR_DEPLOY_AND_RETRIEVE)
    );
  });

  step('Deploy with SFDX: Deploy This Source to Org - ST enabled', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));
    await utilities.getTextEditor(workbench, 'MyClass.cls');
    await runAndValidateCommand(workbench, 'Deploy', 'to', 'ST');
  });

  step('Deploy again (with no changes) - ST enabled', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Deploy', 'to', 'ST', 'Unchanged  ');
  });

  step('Modify the file and deploy again - ST enabled', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));

    // Modify the file by adding a comment.
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, '\t//say hello to a given name');
    await textEditor.save();

    // Deploy running SFDX: Deploy This Source to Org
    await runAndValidateCommand(workbench, 'Deploy', 'to', 'ST', 'Changed  ');
  });

  step('Retrieve with SFDX: Retrieve This Source from Org', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Retrieve', 'from', 'ST');
  });

  step('Modify the file and retrieve again', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));

    // Modify the file by changing the comment.
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, '\t//modified comment');
    await textEditor.save();

    // Retrieve running SFDX: Retrieve This Source from Org

    await runAndValidateCommand(workbench, 'Retrieve', 'from', 'ST');
    // Retrieve operation will overwrite the file, hence the the comment will remain as before the modification
    const textAfterRetrieve = await textEditor.getText();
    await expect(textAfterRetrieve).not.toContain('modified comment');
  });

  step('Prefer Deploy on Save when `Push or deploy on save` is enabled', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));

    await expect(await utilities.enableBooleanSetting(WSK.PUSH_OR_DEPLOY_ON_SAVE_ENABLED)).toBe(
      true
    );
    await utilities.pause(utilities.Duration.seconds(3));

    await expect(
      await utilities.enableBooleanSetting(WSK.PUSH_OR_DEPLOY_ON_SAVE_PREFER_DEPLOY_ON_SAVE)
    ).toBe(true);

    // Clear all notifications so clear output button is reachable
    await utilities.executeQuickPick(
      'Notifications: Clear All Notifications',
      utilities.Duration.seconds(1)
    );

    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));
    // Modify the file and save to trigger deploy
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, `\t// let's trigger deploy`);
    await textEditor.save();
    await utilities.pause(utilities.Duration.seconds(5));

    // At this point there should be no conflicts since this is a new class.
    await validateCommand('Deploy', 'to', 'on save');
  });

  step('Disable Source Tracking Setting', async () => {
    await utilities.executeQuickPick(
      'Notifications: Clear All Notifications',
      utilities.Duration.seconds(1)
    );

    await expect(
      await utilities.disableBooleanSetting(WSK.ENABLE_SOURCE_TRACKING_FOR_DEPLOY_AND_RETRIEVE)
    ).toBe(false);

    // Reload window to update cache and get the setting behavior to work
    await utilities.reloadWindow();
    await utilities.verifyExtensionsAreRunning(
      utilities.getExtensionsToVerifyActive(),
      utilities.Duration.seconds(100)
    );
  });

  step('Deploy with SFDX: Deploy This Source to Org - ST disabled', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear all notifications so clear output button is visible
    await utilities.executeQuickPick('Notifications: Clear All Notifications');
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Deploy', 'to', 'no-ST');
  });

  step('Deploy again (with no changes) - ST disabled', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Deploy', 'to', 'no-ST', 'Unchanged  ');
  });

  step('Modify the file and deploy again - ST disabled', async () => {
    const workbench = await utilities.getWorkbench();
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));

    // Modify the file by adding a comment.
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, '\t//say hello to a given name');
    await textEditor.save();

    // Deploy running SFDX: Deploy This Source to Org
    await runAndValidateCommand(workbench, 'Deploy', 'to', 'no-ST', 'Changed  ');
  });

  step('SFDX: Delete This from Project and Org', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'MyClass.cls');
    // Run SFDX: Push Source to Default Org and Ignore Conflicts to be in sync with remote
    await utilities.executeQuickPick(
      'SFDX: Push Source to Default Org and Ignore Conflicts',
      utilities.Duration.seconds(10)
    );
    // Clear the Output view first.
    await utilities.clearOutputView();

    // clear notifications
    await utilities.dismissAllNotifications();

    await utilities.executeQuickPick(
      'SFDX: Delete This from Project and Org',
      utilities.Duration.seconds(2)
    );

    // Make sure we get a notification for the source delete
    const notificationFound = await utilities.notificationIsPresentWithTimeout(
      'Deleting source files deletes the files from your computer and removes the corresponding metadata from your default org. Are you sure you want to delete this source from your project and your org?',
      utilities.ONE_MINUTE
    );

    await expect(notificationFound).toBe(true);

    // Confirm deletion
    await utilities.acceptNotification(
      'Deleting source files deletes the files from your computer and removes the corresponding metadata from your default org. Are you sure you want to delete this source from your project and your org?',
      'Delete Source',
      utilities.Duration.seconds(5)
    );

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Delete from Project and Org successfully ran',
      utilities.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Delete from Project and Org',
      10
    );
    const outputPanelLineText = `MyClass   ApexClass ${path.join(pathToClass)}.cls`.toLowerCase();
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('*** Deleting with SOAP API ***');
    await expect(outputPanelText).toContain('Status: Succeeded | 1/1 Components');
    await expect(outputPanelText).toContain(`=== Deleted Source`);
    await expect(outputPanelText?.toLowerCase()).toContain(outputPanelLineText);
    await expect(outputPanelText?.toLowerCase()).toContain(`${outputPanelLineText}-meta.xml`);
    await expect(outputPanelText).toContain('Updating source tracking... done');
    await expect(outputPanelText).toContain('ended with exit code 0');
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });

  const runAndValidateCommand = async (
    workbench: Workbench,
    operation: string,
    fromTo: string,
    type: string,
    prefix?: string
  ): Promise<void> => {
    await utilities.executeQuickPick(
      `SFDX: ${operation} This Source ${fromTo} Org`,
      utilities.Duration.seconds(5)
    );

    await validateCommand(operation, fromTo, type, prefix);
  };
  const validateCommand = async (
    operation: string,
    fromTo: string,
    type: string, // Text to identify operation type (if it has source tracking enabled, disabled or if it was a deploy on save)
    prefix: string = ''
  ): Promise<void> => {
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      `SFDX: ${operation} This Source ${fromTo} Org successfully ran`,
      utilities.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      `Starting SFDX: ${operation} This Source ${fromTo}`,
      10
    );
    utilities.log(
      `${operation} time ${type}: ` + (await utilities.getOperationTime(outputPanelText!))
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain(
      `${operation}ed Source`.replace('Retrieveed', 'Retrieved')
    );
    await expect(outputPanelText).toContain(`${prefix}MyClass    ApexClass  ${pathToClass}.cls`);
    await expect(outputPanelText).toContain(
      `${prefix}MyClass    ApexClass  ${pathToClass}.cls-meta.xml`
    );
    await expect(outputPanelText).toContain(`ended SFDX: ${operation} This Source ${fromTo} Org`);
  };
});
