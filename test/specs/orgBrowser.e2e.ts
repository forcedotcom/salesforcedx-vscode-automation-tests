/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('Org Browser', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('OrgBrowser');
    await testSetup.setUp();
  });

  step('Check Org Browser is connected to target org', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Check Org Browser is connected to target org`
    );

    // run org list
    const orgList = await utilities.orgList();
    utilities.log(`org list ${orgList.stdout}`);
    const aliasList = await utilities.aliasList();
    utilities.log(`alias list ${aliasList.stdout}`);
    const orgDisplay = await utilities.orgDisplay(testSetup.scratchOrgAliasName!)
    utilities.log(`org display ${orgDisplay.stdout}`);
    await utilities.openOrgBrowser();

    const orgBrowserLabelEl = await utilities.findElementByText(
      'div',
      'aria-label',
      testSetup.scratchOrgAliasName!
    );
    await expect(orgBrowserLabelEl).toBeTruthy();
    utilities.log(`${testSetup.testSuiteSuffixName} - Org Browser is connected to target org`);
  });

  step('Check some metadata types are available', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Check some metadata types are available`);
    const metadataTypes = [
      'Apex Classes',
      'Apex Triggers',
      'App Menus',
      'Assignment Rules',
      'Aura Components',
      'Auth Providers',
      'Apex Test Suites',
      'Communities',
      'Connected Apps',
      'Certificates',
      'Custom Applications'
    ];
    for (const type of metadataTypes) {
      const element = await utilities.findElementByText('div', 'aria-label', type);
      await expect(element).toBeTruthy();
    }
  });

  step('Verify there are no Apex Classes available', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify there are no Apex Classes available`);
    // Check there are no classes displayed
    const apexClassesLabelEl = await utilities.findElementByText(
      'div',
      'aria-label',
      'Apex Classes'
    );
    await apexClassesLabelEl.click();
    await utilities.pause(utilities.Duration.seconds(5));
    const noCompsAvailableLabelEl = await utilities.findElementByText(
      'div',
      'aria-label',
      'No components available'
    );

    await expect(noCompsAvailableLabelEl).toBeTruthy();
  });

  step('Create Apex Class and deploy to org', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Create Apex Class and deploy to org`);

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
    // Clear the Output view first.
    await utilities.clearOutputView(utilities.Duration.seconds(2));

    // Get text editor
    await utilities.getTextEditor(workbench, 'MyClass.cls');
    await utilities.executeQuickPick(
      'SFDX: Deploy This Source to Org',
      utilities.Duration.seconds(5)
    );

    // Verify the deploy was successful
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Deploy This Source to Org successfully ran',
      utilities.Duration.FIVE_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Close MyClass.cls after deploying
    await browser.keys([CMD_KEY, 'w']);
  });

  step('Refresh Org Browser and check MyClass is there', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Refresh Apex Classes`);
    // Check MyClass is present under Apex Classes section
    await utilities.executeQuickPick('View: Show Org Browser', utilities.Duration.seconds(5));
    const refreshComponentsButton = await (
      await utilities.findElementByText('div', 'aria-label', 'Apex Classes')
    ).$('li[title="SFDX: Refresh Components"]');
    await refreshComponentsButton.click();
    await utilities.pause(utilities.Duration.seconds(5));
    const refreshTypesButton = await utilities.findElementByText(
      'li',
      'title',
      'SFDX: Refresh Types'
    );
    await refreshTypesButton.click();
    await utilities.pause(utilities.Duration.seconds(5));
    const myClassLabelEl = await utilities.findElementByText('div', 'aria-label', 'MyClass');
    await expect(myClassLabelEl).toBeTruthy();
  });

  xstep('Retrieve This Source from Org', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Retrieve This Source from Org`);
    const myClassLabelEl = await utilities.findElementByText('div', 'aria-label', 'MyClass');
    await myClassLabelEl.click();
    await utilities.pause(utilities.Duration.seconds(2));
    const retrieveSourceButton = await utilities.findElementByText(
      'li',
      'title',
      'Retrieve This Source from Org'
    );
    utilities.debug(`button 2 ${JSON.stringify(retrieveSourceButton)}`);
    await retrieveSourceButton.click();

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Retrieve This Source from Org successfully ran',
      utilities.Duration.FIVE_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);
  });

  xstep('Retrieve and Open Source', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Retrieve and Open Source`);
    const myClassLabelEl = await utilities.findElementByText('div', 'aria-label', 'MyClass');
    await myClassLabelEl.click();
    await utilities.pause(utilities.Duration.seconds(2));
    const retrieveAndOpenButton = await utilities.findElementByText(
      'li',
      'title',
      'Retrieve and Open Source'
    );
    utilities.debug(`button 2 ${JSON.stringify(retrieveAndOpenButton)}`);
    await retrieveAndOpenButton.click();

    const workbench = await utilities.getWorkbench();
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Retrieve This Source from Org successfully ran',
      utilities.Duration.FIVE_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify 'Retrieve and Open Source' took us to MyClass.cls
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    await expect(title).toBe('MyClass.cls');
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
