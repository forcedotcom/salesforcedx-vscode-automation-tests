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

describe('Manifest Builder', async () => {
  const testSetup = new TestSetup();
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'ManifestBuilder'
  }

  step('Set up the testing environment', async () => {
    await testSetup.setUp(testReqConfig);
  });

  step('Generate Manifest File', async () => {
    // Normally we would want to run the 'SFDX: Generate Manifest File' command here, but it is only
    // accessible via a context menu, and wdio-vscode-service isn't able to interact with
    // context menus, so instead the manifest file is manually created:

    utilities.log(`${testSetup.testSuiteSuffixName} - calling createCustomObjects()`);
    await utilities.createCustomObjects(testSetup);

    utilities.log(`${testSetup.testSuiteSuffixName} - creating manifest file`);

    const workbench = await browser.getWorkbench();

    // Using the Command palette, run File: New File...
    const inputBox = await utilities.executeQuickPick(
      'Create: New File...',
      utilities.Duration.seconds(1)
    );

    // Set the name of the new manifest file
    const filePath = path.join('manifest', 'manifest.xml');
    await inputBox.setText(filePath);

    // The following 3 confirms are just confirming the file creation and the folder it will belong to
    await inputBox.confirm();
    await inputBox.confirm();
    await inputBox.confirm();

    const textEditor = await utilities.getTextEditor(workbench, 'manifest.xml');
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
    await utilities.pause(utilities.Duration.seconds(1));
    utilities.log(`${testSetup.testSuiteSuffixName} - finished creating manifest file`);
  });

  step('SFDX: Deploy Source in Manifest to Org', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Deploy Source in Manifest to Org`);
    // Clear output before running the command
    await utilities.clearOutputView();
    // Using the Command palette, run SFDX: Deploy Source in Manifest to Org
    await utilities.executeQuickPick(
      'SFDX: Deploy Source in Manifest to Org',
      utilities.Duration.seconds(1)
    );

    // Look for the success notification that appears which says, "SFDX: Deploy This Source to Org successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Deploy This Source to Org successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Deploy This Source to Org',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('Deployed Source');
    await expect(outputPanelText).toContain(
      `Customer__c  CustomObject  ${path.join(
        'force-app',
        'main',
        'default',
        'objects',
        'Customer__c',
        'Customer__c.object-meta.xml'
      )}`
    );
    await expect(outputPanelText).toContain(
      `Product__c   CustomObject  ${path.join(
        'force-app',
        'main',
        'default',
        'objects',
        'Product__c',
        'Product__c.object-meta.xml'
      )}`
    );
    await expect(outputPanelText).toContain('ended SFDX: Deploy This Source to Org');
  });

  step('SFDX: Retrieve Source in Manifest from Org', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Retrieve Source in Manifest from Org`);
    // Using the Command palette, run SFDX: Retrieve Source in Manifest from Org
    const workbench = await browser.getWorkbench();
    await utilities.getTextEditor(workbench, 'manifest.xml');
    // Clear output before running the command
    await utilities.clearOutputView();
    await utilities.executeQuickPick(
      'SFDX: Retrieve Source in Manifest from Org',
      utilities.Duration.seconds(1)
    );

    // Look for the success notification that appears which says, "SFDX: Retrieve This Source from Org successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Retrieve This Source from Org successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Retrieve This Source from Org',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('Retrieved Source');
    await expect(outputPanelText).toContain(
      `Customer__c  CustomObject  ${path.join(
        'force-app',
        'main',
        'default',
        'objects',
        'Customer__c',
        'Customer__c.object-meta.xml'
      )}`
    );
    await expect(outputPanelText).toContain(
      `Product__c   CustomObject  ${path.join(
        'force-app',
        'main',
        'default',
        'objects',
        'Product__c',
        'Product__c.object-meta.xml'
      )}`
    );
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup?.tearDown();
  });
});
