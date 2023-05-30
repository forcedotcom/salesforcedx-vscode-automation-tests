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

describe('Manifest Builder', async () => {
  let testSetup: TestSetup;
  const fiveMinutes = 5 * 60;

  step('Set up the testing environment', async () => {
    utilities.log(`ManifestBuilder - Set up the testing environment`);
    testSetup = new TestSetup('ManifestBuilder', false);
    await testSetup.setUp();
  });

  step('Generate Manifest File', async () => {
    // Normally we would want to run the 'SFDX: Generate Manifest File' command here, but it is only
    // accessible via a context menu, and wdio-vscode-service isn't able to interact with
    // context menus, so instead the manifest file is manually created:

    utilities.log(
      `${testSetup.testSuiteSuffixName} - calling createCustomObjects()`
    );
    await utilities.createCustomObjects(testSetup);

    utilities.log(`${testSetup.testSuiteSuffixName} - creating manifest file`);

    const workbench = await browser.getWorkbench();

    // Using the Command palette, run File: New File...
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'Create: New File...',
      1
    );

    // Set the name of the new manifest file
    const filePath = path.join('manifest', 'manifest.xml');
    await inputBox.setText(filePath);

    // The following 3 confirms are just confirming the file creation and the folder it will belong to
    await inputBox.confirm();
    await inputBox.confirm();
    await inputBox.confirm();

    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor(
      'manifest.xml'
    )) as TextEditor;
    const content = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<Package xmlns="http://soap.sforce.com/2006/04/metadata">`,
      `\t<types>`,
      `\t\t<members>*</members>`,
      `\t\t<name>CustomObject</name>`,
      `\t</types>`,
      `\t<version>57.0</version>`,
      `</Package>`
    ].join('\n');

    await textEditor.setText(content);
    await textEditor.save();
    await utilities.pause(1);
    utilities.log(
      `${testSetup.testSuiteSuffixName} - finished creating manifest file`
    );
  });

  step('SFDX: Deploy Source in Manifest to Org', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Deploy Source in Manifest to Org`
    );
    // Using the Command palette, run SFDX: Deploy Source in Manifest to Org
    const workbench = await browser.getWorkbench();
    // Clear output before running the command
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'View: Clear Output',
      1
    );
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Deploy Source in Manifest to Org',
      1
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Deploy Source to Org',
      fiveMinutes
    );

    // Look for the success notification that appears which says, "SFDX: Deploy Source to Org successfully ran".
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
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deployed Source');
    expect(outputPanelText).toContain(
      'Customer__c  CustomObject  force-app/main/default/objects/Customer__c/Customer__c.object-meta.xml'
    );
    expect(outputPanelText).toContain(
      'Product__c   CustomObject  force-app/main/default/objects/Product__c/Product__c.object-meta.xml'
    );
    expect(outputPanelText).toContain('ended SFDX: Deploy Source to Org');
  });

  step('SFDX: Retrieve Source in Manifest from Org', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Retrieve Source in Manifest from Org`
    );
    // Using the Command palette, run SFDX: Retrieve Source in Manifest from Org
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    await editorView.openEditor('manifest.xml');
    // Clear output before running the command
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'View: Clear Output',
      1
    );
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Retrieve Source in Manifest from Org',
      1
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Retrieve Source from Org',
      fiveMinutes
    );

    // Look for the success notification that appears which says, "SFDX: Retrieve Source from Org successfully ran".
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
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Retrieved Source');
    expect(outputPanelText).toContain(
      'Customer__c  CustomObject  force-app/main/default/objects/Customer__c/Customer__c.object-meta.xml'
    );
    expect(outputPanelText).toContain(
      'Product__c   CustomObject  force-app/main/default/objects/Product__c/Product__c.object-meta.xml'
    );
    expect(outputPanelText).toContain('ended SFDX: Retrieve Source from Org');
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
