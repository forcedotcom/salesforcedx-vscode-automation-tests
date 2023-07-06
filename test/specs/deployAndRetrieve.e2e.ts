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
    testSetup = new TestSetup('DeployAndRetrieve', true);
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
    const workbench = await browser.getWorkbench();
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

  step('Deploy with SFDX: Deploy This Source to Org', async () => {
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: SFDX: Deploy Source to Org',
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
      'Starting Conflict Detection',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('ended Conflict Detection');
    expect(outputPanelText).toContain('Starting SFDX: Deploy Source to Org');
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`Created  MyClass  ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`Created  MyClass  ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Deploy again (with no changes)', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: SFDX: Deploy Source to Org',
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
      'Starting Conflict Detection',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('ended Conflict Detection');
    expect(outputPanelText).toContain('Starting SFDX: Deploy Source to Org');
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`Unchanged  MyClass  ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`Unchanged  MyClass  ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('Modify the file and deploy again', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Modify the file by adding a comment.
    const workbench = await browser.getWorkbench();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('MyClass.cls')) as TextEditor;
    await textEditor.setTextAtLine(2, '\t//say hello to a given name');

    // Deploy running SFDX: Deploy This Source to Org
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: SFDX: Deploy Source to Org',
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
      'Starting Conflict Detection',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('ended Conflict Detection');
    expect(outputPanelText).toContain('Starting SFDX: Deploy Source to Org');
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(`Changed  MyClass  ApexClass  ${pathToClass}.cls`);
    expect(outputPanelText).toContain(`Changed  MyClass  ApexClass  ${pathToClass}.cls-meta.xml`);
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('what?', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });

  step('what?', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });

  step('what?', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });

  step('what?', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });
  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
