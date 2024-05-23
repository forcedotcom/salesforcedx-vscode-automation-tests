/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import path from 'path';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import { Workbench } from 'wdio-vscode-service';

describe('Deploy and Retrieve', async () => {
  let testSetup: TestSetup;
  let projectName: string;
  const pathToClass = path.join('force-app', 'main', 'default', 'classes', 'MyClass');

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('DeployAndRetrieve', false);
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
    const workbench = await (await browser.getWorkbench()).wait();
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
    expect(outputPanelText).toContain(`${pathToClass}.cls`);
    expect(outputPanelText).toContain(`${pathToClass}.cls-meta.xml`);

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
    expect(filteredTreeViewItems.includes('MyClass.cls')).toBe(true);
    expect(filteredTreeViewItems.includes('MyClass.cls-meta.xml')).toBe(true);
  });

  step('Verify Source Tracking Setting is enabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Preferences: Open Workspace Settings',
      5
    );
    await browser.keys(['enable source tracking']);

    // Clear all notifications so setting is reachable
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Notifications: Clear All Notifications',
      1
    );

    const enableSourceTrackingBtn = await utilities.findElementByText(
      'div',
      'title',
      'salesforcedx-vscode-core.experimental.enableSourceTrackingForDeployAndRetrieve'
    );
    expect(await enableSourceTrackingBtn.getAttribute('aria-checked')).toBe('true');
  });

  step('Deploy with SFDX: Deploy This Source to Org - ST enabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);
    await utilities.getTextEditor(workbench, 'MyClass.cls');
    await runAndValidateCommand(workbench, 'Deploy', 'to', 'ST');
  });

  step('Deploy again (with no changes) - ST enabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Deploy', 'to', 'ST', 'Unchanged  ');
  });

  step('Modify the file and deploy again - ST enabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // Modify the file by adding a comment.
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, '\t//say hello to a given name');
    await textEditor.save();

    // Deploy running SFDX: Deploy This Source to Org
    await runAndValidateCommand(workbench, 'Deploy', 'to', 'ST', 'Changed  ');
  });

  step('Retrieve with SFDX: Retrieve This Source from Org', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Retrieve', 'from', 'ST');
  });

  step('Modify the file and retrieve again', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // Modify the file by changing the comment.
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, '\t//modified comment');
    await textEditor.save();

    // Retrieve running SFDX: Retrieve This Source from Org

    await runAndValidateCommand(workbench, 'Retrieve', 'from', 'ST');
    // Retrieve operation will overwrite the file, hence the the comment will remain as before the modification
    const textAfterRetrieve = await textEditor.getText();
    expect(textAfterRetrieve).not.toContain('modified comment');
  });

  step('Prefer Deploy on Save when `Push or deploy on save` is enabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Preferences: Open Workspace Settings',
      3
    );
    await browser.keys(['push on save']);

    const pushOrDeployOnSaveBtn = await utilities.findElementByText(
      'div',
      'title',
      'salesforcedx-vscode-core.push-or-deploy-on-save.enabled'
    );
    await pushOrDeployOnSaveBtn.click();
    await utilities.pause(3);

    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Preferences: Open Workspace Settings',
      3
    );
    await browser.keys(['prefer deploy']);

    try {
      await utilities.runCommandFromCommandPrompt(workbench, 'View: Close Panel', 2);
    } catch {
      utilities.log('Panel is already closed');
    }
    const preferDeployOnSaveBtn = await utilities.findElementByText(
      'div',
      'title',
      'salesforcedx-vscode-core.push-or-deploy-on-save.preferDeployOnSave'
    );
    await preferDeployOnSaveBtn.click();
    await utilities.pause(3);

    // Clear all notifications so clear output button is reachable
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Notifications: Clear All Notifications',
      1
    );

    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);
    // Modify the file and save to trigger deploy
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, `\t// let's trigger deploy`);
    await textEditor.save();
    await utilities.pause(5);

    // At this point there should be no conflicts since this is a new class.
    await validateCommand(workbench, 'Deploy', 'to', 'on save');
  });

  step('Disable Source Tracking Setting', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Preferences: Open Workspace Settings',
      5
    );
    await browser.keys(['enable source tracking']);

    // Clear all notifications so setting is reachable
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Notifications: Clear All Notifications',
      1
    );

    const enableSourceTrackingBtn = await utilities.findElementByText(
      'div',
      'title',
      'salesforcedx-vscode-core.experimental.enableSourceTrackingForDeployAndRetrieve'
    );
    await enableSourceTrackingBtn.click();
    await utilities.pause(1);
    // Reload window to update cache and get the setting behavior to work
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 100);
    await utilities.verifyAllExtensionsAreRunning();
  });

  step('Deploy with SFDX: Deploy This Source to Org - ST disabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear all notifications so clear output button is visible
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Notifications: Clear All Notifications',
      1
    );
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Deploy', 'to', 'no-ST');
  });

  step('Deploy again (with no changes) - ST disabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);
    await utilities.getTextEditor(workbench, 'MyClass.cls');

    await runAndValidateCommand(workbench, 'Deploy', 'to', 'no-ST', 'Unchanged  ');
  });

  step('Modify the file and deploy again - ST disabled', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // Modify the file by adding a comment.
    const textEditor = await utilities.getTextEditor(workbench, 'MyClass.cls');
    await textEditor.setTextAtLine(2, '\t//say hello to a given name');
    await textEditor.save();

    // Deploy running SFDX: Deploy This Source to Org
    await runAndValidateCommand(workbench, 'Deploy', 'to', 'no-ST', 'Changed  ');
  });

  step('SFDX: Delete This from Project and Org', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.getTextEditor(workbench, 'MyClass.cls');
    // Run SFDX: Push Source to Default Org and Ignore Conflicts to be in sync with remote
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Ignore Conflicts',
      10
    );
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Delete This from Project and Org',
      2
    );

    // Make sure we get a confirmation dialog
    const confirmationDialogText =
      'Deleting source files deletes the files from your computer and removes the corresponding metadata from your default org. Are you sure you want to delete this source from your project and your org?, source: Salesforce CLI Integration, notification, Inspect the response in the accessible view with Option+F2';
    const confirmationDialogEl = await utilities.findElementByText(
      'div',
      'aria-label',
      confirmationDialogText
    );
    expect(confirmationDialogEl).toBeTruthy();

    // Confirm deletion
    const deleteSourceBtn = await utilities.findElementByText(
      'a',
      'class',
      'monaco-button monaco-text-button'
    );
    await deleteSourceBtn.click();

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Delete from Project and Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Delete from Project and Org',
      10
    );
    const outputPanelLineText = `MyClass   ApexClass ${path.join(pathToClass)}.cls`.toLowerCase();
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('*** Deleting with SOAP API ***');
    expect(outputPanelText).toContain('Status: Succeeded | 1/1 Components');
    expect(outputPanelText).toContain(`=== Deleted Source`);
    expect(outputPanelText?.toLowerCase()).toContain(outputPanelLineText);
    expect(outputPanelText?.toLowerCase()).toContain(`${outputPanelLineText}-meta.xml`);
    expect(outputPanelText).toContain('Updating source tracking... done');
    expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });

  const runAndValidateCommand = async (
    workbench: Workbench,
    operation: string,
    fromTo: string,
    type: string,
    prefix?: string
  ): Promise<void> => {
    await utilities.runCommandFromCommandPrompt(
      workbench,
      `SFDX: ${operation} This Source ${fromTo} Org`,
      5
    );

    await validateCommand(workbench, operation, fromTo, type, prefix);
  };
  const validateCommand = async (
    workbench: Workbench,
    operation: string,
    fromTo: string,
    type: string, // Text to identify operation type (if it has source tracking enabled, disabled or if it was a deploy on save)
    prefix: string = ''
  ): Promise<void> => {
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      `SFDX: ${operation} This Source ${fromTo} Org successfully ran`,
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      `Starting SFDX: ${operation} This Source ${fromTo}`,
      10
    );
    utilities.log(
      `${operation} time ${type}: ` + (await utilities.getOperationTime(outputPanelText!))
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain(`${operation}ed Source`.replace('Retrieveed', 'Retrieved'));
    expect(outputPanelText).toContain(`${prefix}MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`${prefix}MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain(`ended SFDX: ${operation} This Source ${fromTo} Org`);
  };
});
