/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('Org Browser', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('OrgBrowser', false);
    await testSetup.setUp();
  });

  step('Check Org Browser is connected to target org', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Check Org Browser is connected to target org`
    );
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Show Org Browser', 5);

    const orgBrowserLabelEl = await utilities.findElementByText(
      'div',
      'aria-label',
      testSetup.scratchOrgAliasName!
    );
    utilities.log(`${testSetup.testSuiteSuffixName} - Org Browser is connected to target org`);
    expect(orgBrowserLabelEl).toBeTruthy();
  });

  step('Verify there are no Apex Classes available', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify there are no Apex Classes available`);
    // Check there are no classes displayed
    const apexClassesLabelEl = await utilities.findElementByText(
      'div',
      'aria-label',
      'Apex Classes'
    );
    apexClassesLabelEl.click();
    utilities.pause(5);
    const noCompsAvailableLabelEl = await utilities.findElementByText(
      'div',
      'aria-label',
      'No components available'
    );

    expect(noCompsAvailableLabelEl).toBeTruthy();
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

    const workbench = await (await browser.getWorkbench()).wait();
    // Clear the Output view first.
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 2);

    // Get text editor
    await utilities.getTextEditor(workbench, 'MyClass.cls');
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Deploy This Source to Org', 5);

    // Verify the deploy was successful
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Deploy Source to Org successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);
  });

  step('Refresh Org Browser and check MyClass is there', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Refresh Apex Classes`);
    // Check MyClass is present under Apex Classes section
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Show Org Browser', 5);
    const refreshButton = await (
      await utilities.findElementByText('div', 'aria-label', 'Apex Classes')
    ).$('li[title="Refresh Components"]');
    await refreshButton.click();
    await utilities.pause(5);
    await utilities.runCommandFromCommandPrompt(workbench, 'Refresh Components', 5);
    const myClassLabelEl = await utilities.findElementByText('div', 'aria-label', 'MyClass');
    expect(myClassLabelEl).toBeTruthy();
  });

  step('Retrieve Source from Org', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Retrieve Source from Org`);
    const myClassLabelEl = await utilities.findElementByText('div', 'aria-label', 'MyClass');
    await myClassLabelEl.click();
    await utilities.pause(2);
    const retrieveSourceButton = await utilities.findElementByText(
      'a',
      'aria-label',
      'Retrieve Source from Org'
    );
    console.log('button 1', retrieveSourceButton);
    await retrieveSourceButton.click();

    const workbench = await (await browser.getWorkbench()).wait();
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Retrieve Source from Org successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);
  });

  step('Retrieve and Open Source', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Retrieve and Open Source`);
    const myClassLabelEl = await utilities.findElementByText('div', 'aria-label', 'MyClass');
    myClassLabelEl.click();
    utilities.pause(2);
    const retrieveAndOpenButton = await utilities.findElementByText(
      'a',
      'aria-label',
      'Retrieve and Open Source'
    );
    console.log('button 2', retrieveAndOpenButton);
    await retrieveAndOpenButton.click();

    const workbench = await (await browser.getWorkbench()).wait();
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Retrieve Source from Org successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify 'Retrieve and Open Source' took us to MyClass.cls
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('MyClass.cls');
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
