/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import path from 'path';
import { TextEditor } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

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
    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Apex Class successfully ran',
      10
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
    await browser.keys([
      'e',
      'n',
      'a',
      'b',
      'l',
      'e',
      'Space',
      's',
      'o',
      'u',
      'r',
      'c',
      'e',
      'Space',
      't',
      'r',
      'a',
      'c',
      'k',
      'i',
      'n',
      'g'
    ]);

    // Clear all notifications so setting is reachable
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Notifications: Clear All Notifications',
      1
    );

    const enableSourceTrackingBtn = await $(
      'div[title="salesforcedx-vscode-core.experimental.enableSourceTrackingForDeployAndRetrieve"]'
    );
    expect(await enableSourceTrackingBtn.getAttribute('aria-checked')).toBe('true');
  });

  step('Deploy with SFDX: Deploy This Source to Org - ST enabled', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      utilities.FIVE_MINUTES
    );
    // At this point there should be no conflicts since this is a new class.
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Deploy Source to Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy Source to Org',
      10
    );
    utilities.log('Deploy time ST - 1: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Deploy again (with no changes) - ST enabled', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      utilities.FIVE_MINUTES
    );
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Deploy Source to Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy Source to Org',
      10
    );
    utilities.log('Deploy time ST - 2: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`Unchanged  MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(
      `Unchanged  MyClass    ApexClass  ${pathToClass}.cls-meta.xml`
    );
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Modify the file and deploy again - ST enabled', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Modify the file by adding a comment.
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await textEditor.setTextAtLine(2, '\t//say hello to a given name');
    await textEditor.save();

    // Deploy running SFDX: Deploy This Source to Org
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      utilities.FIVE_MINUTES
    );
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Deploy Source to Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy Source to Org',
      10
    );
    utilities.log('Deploy time ST - 3: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`Changed  MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`Changed  MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Retrieve with SFDX: Retrieve This Source from Org', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Retrieve This Source from Org',
      5
    );
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Retrieve Source from Org',
      utilities.FIVE_MINUTES
    );

    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Retrieve Source from Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Retrieve Source from Org',
      10
    );
    utilities.log('Retrieve time - 1: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Retrieved Source');
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Retrieve Source from Org');
  });

  step('Modify the file and retrieve again', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Modify the file by changing the comment.
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await textEditor.setTextAtLine(2, '\t//modified comment');
    await textEditor.save();

    // Deploy running SFDX: Retrieve This Source from Org
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Retrieve This Source from Org',
      5
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Retrieve Source from Org',
      utilities.FIVE_MINUTES
    );
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Retrieve Source from Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);
    const textAfterRetrieve = await textEditor.getText();

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Retrieve Source from Org',
      10
    );
    utilities.log('Retrieve time - 2: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Retrieved Source');
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Retrieve Source from Org');
    // Retrieve operation will overwrite the file, hence the the comment will remain as before the modification
    expect(textAfterRetrieve).not.toContain('modified comment');
  });

  step('Prefer Deploy on Save when `Push or deploy on save` is enabled', async () => {
    // Clear the Output view first.
    let outputView = await utilities.openOutputView();
    await outputView.clearText();

    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Preferences: Open Workspace Settings',
      5
    );
    await browser.keys(['p', 'u', 's', 'h', 'Space', 'o', 'n', 'Space', 's', 'a', 'v', 'e']);

    const pushOrDeployOnSaveBtn = await $(
      'div[title="salesforcedx-vscode-core.push-or-deploy-on-save.enabled"]'
    );
    await pushOrDeployOnSaveBtn.click();
    await utilities.pause(1);

    const preferDeployOnSaveBtn = await $(
      'div[title="salesforcedx-vscode-core.push-or-deploy-on-save.preferDeployOnSave"]'
    );
    await preferDeployOnSaveBtn.click();
    await utilities.pause(1);

    // Clear all notifications so clear output button is reachable
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Notifications: Clear All Notifications',
      1
    );

    // Clear the Output view first.
    outputView = await utilities.openOutputView();
    await outputView.clearText();
    // Modify the file and save to trigger deploy
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await textEditor.setTextAtLine(2, `\t// let's trigger deploy`);
    await textEditor.save();
    await utilities.pause(1);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      utilities.FIVE_MINUTES
    );
    // At this point there should be no conflicts since this is a new class.
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Deploy Source to Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy Source to Org',
      10
    );
    utilities.log('Deploy time - on save: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Disable Source Tracking Setting', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Preferences: Open Workspace Settings',
      5
    );
    await browser.keys([
      'e',
      'n',
      'a',
      'b',
      'l',
      'e',
      'Space',
      's',
      'o',
      'u',
      'r',
      'c',
      'e',
      'Space',
      't',
      'r',
      'a',
      'c',
      'k',
      'i',
      'n',
      'g'
    ]);

    // Clear all notifications so setting is reachable
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Notifications: Clear All Notifications',
      1
    );

    const enableSourceTrackingBtn = await $(
      'div[title="salesforcedx-vscode-core.experimental.enableSourceTrackingForDeployAndRetrieve"]'
    );
    await enableSourceTrackingBtn.click();
    await utilities.pause(1);
    // Reload window to update cache and get the setting behavior to work
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 10);
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
    const outputView = await (await utilities.openOutputView()).wait();
    await outputView.clearText();
    const editorView = await workbench.getEditorView();
    (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      utilities.FIVE_MINUTES
    );
    // At this point there should be no conflicts since this is a new class.
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Deploy Source to Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy Source to Org',
      10
    );
    utilities.log('Deploy time no-ST - 1: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Deploy again (with no changes) - ST disabled', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      utilities.FIVE_MINUTES
    );
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Deploy Source to Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy Source to Org',
      10
    );
    utilities.log('Deploy time no-ST - 2: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`Unchanged  MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(
      `Unchanged  MyClass    ApexClass  ${pathToClass}.cls-meta.xml`
    );
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Modify the file and deploy again - ST disabled', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Modify the file by adding a comment.
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await textEditor.setTextAtLine(2, '\t//say hello to a given name');
    await textEditor.save();

    // Deploy running SFDX: Deploy This Source to Org
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      utilities.FIVE_MINUTES
    );
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Deploy Source to Org successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy Source to Org',
      10
    );
    utilities.log('Deploy time no-ST - 3: ' + (await utilities.getOperationTime(outputPanelText!)));
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`Changed  MyClass    ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`Changed  MyClass    ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
