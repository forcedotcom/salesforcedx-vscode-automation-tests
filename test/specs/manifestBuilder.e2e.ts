/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import * as fs from 'fs-extra';
import path from 'path';

describe('Manifest Builder', async () => {
  let testSetup: TestSetup;
  let projectName: string;
  const fiveMinutes = 5 * 60;

  step('Set up the testing environment', async () => {
    utilities.log(`ManifestBuilder - Set up the testing environment`);
    testSetup = new TestSetup('ManifestBuilder', true);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();

    utilities.log(
      `${testSetup.testSuiteSuffixName} - calling createCustomObjects()`
    );
    utilities.createCustomObjects(testSetup);

    utilities.log(
      `${testSetup.testSuiteSuffixName} - calling createManifestFile()`
    );
    utilities.createManifestFile(testSetup);
  });

  // TODO: Select components and magically generate manifest file without the context menu :clown_face:
  // step('SFDX: Generate Manifest File', async () => {
  //   utilities.log(
  //     `${testSetup.testSuiteSuffixName} - SFDX: Generate Manifest File`
  //   );
  //   // TODO: Find a way to use SFDX: Generate Manifest File

  //   // // Set the name of the new manifest file
  //   // await inputBox.setText('manifest');
  //   // await inputBox.confirm();

  //   // // Wait for the command to execute
  //   // const workbench = await browser.getWorkbench();
  //   // await utilities.waitForNotificationToGoAway(
  //   //   workbench,
  //   //   'Running SFDX: Generate Manifest File',
  //   //   fiveMinutes
  //   // );

  //   // // Look for the success notification that appears which says, "SFDX: Generate Manifest File successfully ran".
  //   // const successNotificationWasFound = await utilities.notificationIsPresent(
  //   //   workbench,
  //   //   'SFDX: Generate Manifest File successfully ran'
  //   // );
  //   // expect(successNotificationWasFound).toBe(true);

  //   // // Verify manifest file was created
  //   // const editorView = workbench.getEditorView();
  //   // const activeTab = await editorView.getActiveTab();
  //   // const title = await activeTab?.getTitle();
  //   // expect(title).toBe('manifest.xml');

  //   // // Verify Output tab
  //   // const outputPanelText = await utilities.attemptToFindOutputPanelText(
  //   //   'Salesforce CLI',
  //   //   'Starting SFDX: Generate Manifest File',
  //   //   10
  //   // );
  //   // expect(outputPanelText).not.toBeUndefined();
  //   // expect(outputPanelText).toContain('ended SFDX: Generate Manifest File');
  // });

  step('SFDX: Deploy Source in Manifest to Org', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Deploy Source in Manifest to Org`
    );
    // Using the Command palette, run SFDX: Deploy Source in Manifest to Org
    const workbench = await browser.getWorkbench();
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
      'Starting SFDX: Deploy Source in Manifest to Org',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Deployed Source');
    expect(outputPanelText).toContain('STATE');
    expect(outputPanelText).toContain('FULL NAME');
    expect(outputPanelText).toContain('TYPE');
    expect(outputPanelText).toContain('PROJECT PATH');
    expect(outputPanelText).toContain('Customer__c');
    expect(outputPanelText).toContain('Product__c');
    expect(outputPanelText).toContain('CustomObject');
    expect(outputPanelText).toContain(
      'force-app/main/default/objects/CustomSObjects/Customer__c/Customer__c.object-meta.xml'
    );
    expect(outputPanelText).toContain(
      'ended SFDX: Deploy Source in Manifest to Org'
    );
  });

  step('SFDX: Retrieve Source in Manifest from Org', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Retrieve Source in Manifest from Org`
    );
    // Using the Command palette, run SFDX: Retrieve Source in Manifest from Org
    const workbench = await browser.getWorkbench();
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
      'Starting SFDX: Retrieve Source in Manifest from Org',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Retrieved Source');
    expect(outputPanelText).toContain('FULL NAME');
    expect(outputPanelText).toContain('TYPE');
    expect(outputPanelText).toContain('PROJECT PATH');
    expect(outputPanelText).toContain('Customer__c');
    expect(outputPanelText).toContain('Product__c');
    expect(outputPanelText).toContain('CustomObject');
    expect(outputPanelText).toContain(
      'force-app/main/default/objects/CustomSObjects/Customer__c/Customer__c.object-meta.xml'
    );
    expect(outputPanelText).toContain(
      'ended SFDX: Retrieve Source in Manifest from Org'
    );
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
