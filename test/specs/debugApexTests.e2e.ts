/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import { TreeItem } from 'wdio-vscode-service';
import { Duration } from '@salesforce/kit';

describe('Debug Apex Tests', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('DebugApexTests', false);
    await testSetup.setUp();

    // Create Apex class 1 and test
    await utilities.createApexClassWithTest('ExampleApexClass1');
    await utilities.pause(Duration.seconds(1));

    // Create Apex class 2 and test
    await utilities.createApexClassWithTest('ExampleApexClass2');
    await utilities.pause(Duration.seconds(1));

    // Push source to org
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick(
      'SFDX: Push Source to Default Org and Ignore Conflicts',
      Duration.seconds(1)
    );

    // Look for the success notification that appears which says, "SFDX: Push Source to Default Org and Ignore Conflicts successfully ran".
    const successPushNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org and Ignore Conflicts successfully ran',
      utilities.TEN_MINUTES
    );
    await expect(successPushNotificationWasFound).toBe(true);
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get Apex LSP Status Bar
    const workbench = await utilities.getWorkbench();
    const statusBar = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      'Editor Language Status'
    );
    await statusBar.click();
    await expect(await statusBar.getAttribute('aria-label')).toContain('Indexing complete');
  });

  step('Debug All Tests via Apex Class', async () => {
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleApexClass1Test.cls');

    // Click the "Debug All Tests" code lens at the top of the class
    const codeLens = await textEditor.getCodeLens(0);
    const codeLensElem = await codeLens?.elem;
    const debugAllTestsOption = await codeLensElem?.$('=Debug All Tests');
    await debugAllTestsOption!.click();

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
  });

  step('Debug Single Test via Apex Class', async () => {
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleApexClass2Test.cls');

    // Click the "Debug Test" code lens at the top of one of the test methods
    const codeLens = await textEditor.getCodeLens(1);
    const codeLensElem = await codeLens?.elem;
    const debugTestOption = await codeLensElem?.$('=Debug Test');
    await debugTestOption!.click();

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
  });

  step('Debug all Apex Methods on a Class via the Test Sidebar', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('Testing: Focus on Apex Tests View', Duration.seconds(1));

    // Open the Test Sidebar
    const apexTestsSection = await utilities.getTestsSection(workbench, 'APEX TESTS');

    const apexTestsItems = await utilities.retrieveExpectedNumTestsFromSidebar(
      4,
      apexTestsSection,
      'Refresh Tests'
    );

    // Make sure all the tests are present in the sidebar
    await expect(apexTestsItems.length).toBe(4);
    await expect(await apexTestsSection.findItem('ExampleApexClass1Test')).toBeTruthy();
    await expect(await apexTestsSection.findItem('ExampleApexClass2Test')).toBeTruthy();
    await expect(await apexTestsItems[0].getLabel()).toBe('ExampleApexClass1Test');
    await expect(await apexTestsItems[2].getLabel()).toBe('ExampleApexClass2Test');

    // Click the debug tests button that is shown to the right when you hover a test class name on the Test sidebar
    await apexTestsSection.elem.click();
    const apexTestItem = (await apexTestsSection.findItem('ExampleApexClass1Test')) as TreeItem;
    await apexTestItem.select();
    const debugTestsAction = await (await apexTestItem.elem).$('a[aria-label="Debug Tests"]');
    await debugTestsAction.click();
    await utilities.pause(Duration.seconds(1));

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
  });

  step('Debug a Single Apex Test Method via the Test Sidebar', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('Testing: Focus on Apex Tests View', Duration.seconds(1));

    // Open the Test Sidebar
    const apexTestsSection = await utilities.getTestsSection(workbench, 'APEX TESTS');

    // Hover a test name under one of the test class sections and click the debug button that is shown to the right of the test name on the Test sidebar
    await browser.keys(['Escape']);
    await apexTestsSection.elem.click();
    const apexTestItem = (await apexTestsSection.findItem('validateSayHello')) as TreeItem;
    await apexTestItem.select();
    const debugTestAction = await (await apexTestItem.elem).$('a[aria-label="Debug Single Test"]');
    await debugTestAction.click();
    await utilities.pause(Duration.seconds(1));

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(['F5']);
    await utilities.pause(Duration.seconds(1));
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
