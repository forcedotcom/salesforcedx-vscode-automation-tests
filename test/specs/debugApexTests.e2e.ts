/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { SideBarView, TextEditor, TreeItem } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('Debug Apex Tests', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('DebugApexTests', true);
    await testSetup.setUp();

    // Create Apex class 1 and test
    await utilities.createApexClassWithTest('ExampleApexClass1');
    await utilities.pause(1);

    // Create Apex class 2 and test
    await utilities.createApexClassWithTest('ExampleApexClass2');
    await utilities.pause(1);

    // Push source to org
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts',
      1
    );

    // Look for the success notification that appears which says, "SFDX: Push Source to Default Org and Override Conflicts successfully ran".
    const successPushNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successPushNotificationWasFound).toBe(true);
  });

  step('Debug All Tests via Apex Class', async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('ExampleApexClass1Test.cls');
    await inputBox.confirm();
    await utilities.pause(1);

    const editorView = workbench.getEditorView();

    // Open an existing apex test
    const textEditor = (await editorView.openEditor('ExampleApexClass1Test.cls')) as TextEditor;

    // Click the "Debug All Tests" code lens at the top of the class
    const codeLens = await textEditor.getCodeLens(0);
    const codeLensElem = await codeLens?.elem;
    const debugAllTestsOption = await codeLensElem?.$('=Debug All Tests');
    await debugAllTestsOption!.click();

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);
  });

  step('Debug Single Test via Apex Class', async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('ExampleApexClass2Test.cls');
    await inputBox.confirm();
    await utilities.pause(1);

    const editorView = workbench.getEditorView();

    // Open an existing apex test
    const textEditor = (await editorView.openEditor('ExampleApexClass2Test.cls')) as TextEditor;

    // Click the "Debug Test" code lens at the top of one of the test methods
    const codeLens = await textEditor.getCodeLens(1);
    const codeLensElem = await codeLens?.elem;
    const debugTestOption = await codeLensElem?.$('=Debug Test');
    await debugTestOption!.click();

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);
  });

  step('Debug all Apex Methods on a Class via the Test Sidebar', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    utilities.log('1');
    const activityBar = workbench.getActivityBar();
    utilities.log('1.5');
    const testingView = await activityBar.getViewControl('Testing');
    // const testingView = await workbench.getActivityBar().getViewControl('Testing');
    utilities.log('2');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);
    utilities.log('3');

    const sidebar = workbench.getSideBar();
    utilities.log('4');
    const sidebarView = sidebar.getContent();
    utilities.log('5');
    const apexTestsSection = await sidebarView.getSection('APEX TESTS');
    expect(apexTestsSection.elem).toBePresent();
    utilities.log('6');

    let apexTestsItems = (await apexTestsSection.getVisibleItems()) as TreeItem[];
    utilities.log('7');
    await browser.keys(['Escape']);

    // If the Apex tests did not show up, click the refresh button on the top right corner of the Test sidebar
    for (let x = 0; x < 3; x++) {
      if (apexTestsItems.length === 1) {
        await apexTestsSection.elem.click();
        const refreshAction = await apexTestsSection.getAction('Refresh Tests');
        await refreshAction!.elem.click();
        utilities.pause(10);
        apexTestsItems = (await apexTestsSection.getVisibleItems()) as TreeItem[];
      }
      else if (apexTestsItems.length === 6) {
        break;
      }
      else {
        // do nothing
      }
    }
    utilities.log('8');

    // Make sure all the tests are present in the sidebar
    expect(apexTestsItems.length).toBe(4);
    expect(await apexTestsSection.findItem('ExampleApexClass1Test')).toBeTruthy();
    expect(await apexTestsSection.findItem('ExampleApexClass2Test')).toBeTruthy();
    expect(await apexTestsItems[0].getLabel()).toBe('ExampleApexClass1Test');
    expect(await apexTestsItems[2].getLabel()).toBe('ExampleApexClass2Test');
    utilities.log('9');

    // Click the debug tests button that is shown to the right when you hover a test class name on the Test sidebar
    utilities.log('10');
    await apexTestsSection.elem.click();
    utilities.log('11');
    const apexTestItem = (await apexTestsSection.findItem('ExampleApexClass1Test')) as TreeItem;
    await apexTestItem.select();
    utilities.log('12');
    const runTestsAction = await apexTestItem.getActionButton('Debug Tests');
    await runTestsAction!.elem.click();
    utilities.log('13');
    await utilities.pause(1);

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);
    utilities.log('14');

    // Continue with the debug session
    await browser.keys(['F5']);
    utilities.log('15');
    await utilities.pause(1);
    await browser.keys(['F5']);
    utilities.log('16');
    await utilities.pause(1);
  });

  step('Debug a Single Apex Test Method via the Test Sidebar', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const apexTestsSection = await sidebarView.getSection('APEX TESTS');
    expect(apexTestsSection.elem).toBePresent();

    // Hover a test name under one of the test class sections and click the debug button that is shown to the right of the test name on the Test sidebar
    await browser.keys(['Escape']);
    await apexTestsSection.elem.click();
    const apexTestItem = (await apexTestsSection.findItem('validateSayHello')) as TreeItem;
    await apexTestItem.select();
    const runTestAction = await apexTestItem.getActionButton('Debug Single Test');
    await runTestAction!.elem.click();
    await utilities.pause(1);

    // Look for the success notification that appears which says, "Debug Test(s) successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.FIVE_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
