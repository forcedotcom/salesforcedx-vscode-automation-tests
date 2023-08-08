/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { InputBox, QuickOpenBox, SideBarView, TextEditor, TreeItem } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('Run Apex Tests', async () => {
  let prompt: QuickOpenBox | InputBox;
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('RunApexTests', true);
    await testSetup.setUp();

    // Create Apex class 1 and test
    await utilities.createApexClassWithTest('ExampleApexClass1');

    // Create Apex class 2 and test
    await utilities.createApexClassWithTest('ExampleApexClass2');

    // Create Apex class 3 and test
    await utilities.createApexClassWithTest('ExampleApexClass3');

    // Push source to org
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts',
      1
    );
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Push Source to Default Org and Override Conflicts',
      utilities.FIVE_MINUTES
    );
    const successPushNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts successfully ran'
    );
    expect(successPushNotificationWasFound).toBe(true);
  });

  step('Run All Tests via Apex Class', async () => {
    const workbench = await browser.getWorkbench();
    
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('ExampleApexClass1Test.cls');
    await inputBox.confirm();
    await utilities.pause(1);

    const editorView = workbench.getEditorView();

    // Open an existing apex test (e.g. BotTest.cls, search for @isTest)
    const textEditor = (await editorView.openEditor('ExampleApexClass1Test.cls')) as TextEditor;

    // Click the "Run All Tests" code lens at the top of the class
    const codeLens = await textEditor.getCodeLens('Run All Tests');
    const codeLensElem = await codeLens?.elem;
    const runAllTestsOption = await codeLensElem?.$('=Run All Tests');
    await runAllTestsOption!.click();

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Build Apex Test Suite successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Test Summary');
    expect(outputPanelText).toContain('TEST NAME');
    expect(outputPanelText).toContain('ExampleApexClass1Test.validateSayHello');
    expect(outputPanelText).toContain('ended SFDX: Run Apex Tests');
  });

  step('Run Single Test via Apex Class', async () => {
    const workbench = await browser.getWorkbench();

    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('ExampleApexClass2Test.cls');
    await inputBox.confirm();
    await utilities.pause(1);

    const editorView = workbench.getEditorView();

    // Open an existing apex test (e.g. BotTest.cls, search for @isTest)
    const textEditor = (await editorView.openEditor('ExampleApexClass2Test.cls')) as TextEditor;

    // Click the "Run Test" code lens at the top of one of the test methods
    const codeLens = await textEditor.getCodeLens('Run Test');
    const codeLensElem = await codeLens?.elem;
    const runTestOption = await codeLensElem?.$('=Run Test');
    await runTestOption!.click();

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Build Apex Test Suite successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Test Summary');
    expect(outputPanelText).toContain('TEST NAME');
    expect(outputPanelText).toContain('ExampleApexClass2Test.validateSayHello');
    expect(outputPanelText).toContain('ended SFDX: Run Apex Tests');
  });

  step('Run Tests via Command Palette', async () => {
    // Run SFDX: Run Apex tests.
    const workbench = await browser.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Run Apex Tests', 1);

    // Select the "ExampleApexClass1Test" file
    await prompt.selectQuickPick('ExampleApexClass1Test');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Run Apex Tests successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Test Summary');
    expect(outputPanelText).toContain('TEST NAME');
    expect(outputPanelText).toContain('ended SFDX: Run Apex Tests');
  });

  step('Re-run Last Apex Test Class', async () => {
    const workbench = await browser.getWorkbench();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('ExampleApexClass1Test.cls');
    await inputBox.confirm();
    await utilities.pause(1);

    const editorView = await workbench.getEditorView();

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const apexTestsSection = await sidebarView.getSection('APEX TESTS');
    expect(apexTestsSection.elem).toBePresent();

    // Open an existing apex test and modify it
    const textEditor = (await editorView.openEditor('ExampleApexClass1Test.cls')) as TextEditor;
    const testText = [
      `@IsTest`,
      `public class ExampleApexClass1Test {`,
      `\t@IsTest`,
      `\tstatic void validateSayHello() {`,
      `\t\tSystem.debug('Starting validate');`,
      `\t\tExampleApexClass1.SayHello('Andres');`,
      `\t\tSystem.assertEquals(1, 1, 'all good');`,
      `\t}`,
      `}`
    ].join('\n');
    await textEditor.setText(testText);
    await textEditor.save();

    // Open command palette and run "SFDX: Push Source to Default Org"
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts',
      1
    );
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Push Source to Default Org and Override Conflicts',
      utilities.FIVE_MINUTES
    );
    const successPushNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts successfully ran'
    );
    expect(successPushNotificationWasFound).toBe(true);
  });

  step('Run all Apex tests via Test Sidebar', async () => {
    const workbench = await browser.getWorkbench();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const apexTestsSection = await sidebarView.getSection('APEX TESTS');
    expect(apexTestsSection.elem).toBePresent();

    const apexTestsItems = (await apexTestsSection.getVisibleItems()) as TreeItem[];
    utilities.pause(20);
    expect(apexTestsItems.length).toBe(6);
    expect(await apexTestsSection.findItem('ExampleApexClass1Test')).toBeTruthy();
    expect(await apexTestsSection.findItem('ExampleApexClass2Test')).toBeTruthy();
    expect(await apexTestsSection.findItem('ExampleApexClass3Test')).toBeTruthy();
    expect(await apexTestsItems[0].getLabel()).toBe('ExampleApexClass1Test');
    expect(await apexTestsItems[2].getLabel()).toBe('ExampleApexClass2Test');
    expect(await apexTestsItems[4].getLabel()).toBe('ExampleApexClass3Test');

    // Click the run tests button on the top right corner of the Test sidebar
    const runTestsAction = await apexTestsSection.getAction('Run Tests');
    await runTestsAction!.elem.click();

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Run Apex Tests successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Test Summary');
    expect(outputPanelText).toContain('100%');
    expect(outputPanelText).toContain('ExampleApexClass1Test.validateSayHello');
    expect(outputPanelText).toContain('ExampleApexClass2Test.validateSayHello');
    expect(outputPanelText).toContain('ExampleApexClass3Test.validateSayHello');
    expect(outputPanelText).toContain('ended SFDX: Run Apex Tests');

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    for (const item of apexTestsItems) {
      const icon = await (await item.elem).$('.custom-view-tree-node-item-icon');
      const iconStyle = await icon.getAttribute('style');
      expect(iconStyle).toContain('testPass');
    }
  });

  step('Run all Apex Tests on a Class via the Test Sidebar', async () => {
    const workbench = await browser.getWorkbench();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const apexTestsSection = await sidebarView.getSection('APEX TESTS');
    expect(apexTestsSection.elem).toBePresent();

    // Click the run test button that is shown to the right when you hover a test class name on the Test sidebar
    const apexTestItem = (await apexTestsSection.findItem('ExampleApexClass2Test')) as TreeItem;
    await apexTestItem.select();
    const runTestsAction = await apexTestItem.getActionButton('Run Tests');
    await runTestsAction!.elem.click();

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Run Apex Tests successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Test Summary');
    expect(outputPanelText).toContain('TEST NAME');
    expect(outputPanelText).toContain('ExampleApexClass2Test.validateSayHello');
    expect(outputPanelText).toContain('ended SFDX: Run Apex Tests');

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    const icon = await (await apexTestItem.elem).$('.custom-view-tree-node-item-icon');
    const iconStyle = await icon.getAttribute('style');
    expect(iconStyle).toContain('testPass');
  });

  step('Run a Single Apex Test via the Test Sidebar', async () => {
    const workbench = await browser.getWorkbench();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const apexTestsSection = await sidebarView.getSection('APEX TESTS');
    expect(apexTestsSection.elem).toBePresent();

    // Hover a test name under one of the test class sections and click the run button that is shown to the right of the test name on the Test sidebar
    const apexTestItem = (await apexTestsSection.findItem('validateSayHello')) as TreeItem;
    await apexTestItem.select();
    const runTestAction = await apexTestItem.getActionButton('Run Single Test');
    await runTestAction!.elem.click();

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Run Apex Tests successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Test Summary');
    expect(outputPanelText).toContain('TEST NAME');
    expect(outputPanelText).toContain('ExampleApexClass3Test.validateSayHello');
    expect(outputPanelText).toContain('ended SFDX: Run Apex Tests');

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    const icon = await (await apexTestItem.elem).$('.custom-view-tree-node-item-icon');
    const iconStyle = await icon.getAttribute('style');
    expect(iconStyle).toContain('testPass');
  });

  step('Run a test that fails and fix it', async () => {
    // Create Apex class AccountService
    await utilities.createApexClassWithBugs();

    // Push source to org
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts',
      1
    );
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Push Source to Default Org and Override Conflicts',
      utilities.FIVE_MINUTES
    );
    const successPushNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts successfully ran'
    );
    expect(successPushNotificationWasFound).toBe(true);

    // Run SFDX: Run Apex tests.
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Run Apex Tests', 1);

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Run Apex Tests successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    let outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Assertion Failed: incorrect ticker symbol');
    expect(outputPanelText).toContain('Expected: CRM, Actual: SFDC');

    // Fix test
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('AccountService.cls');
    await inputBox.confirm();
    await utilities.pause(1);

    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('AccountService.cls')) as TextEditor;
    await textEditor.setTextAtLine(6, '\t\t\tTickerSymbol = tickerSymbol');
    await textEditor.save();
    await utilities.pause(1);

    // Push source to org
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts',
      1
    );
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Push Source to Default Org and Override Conflicts',
      utilities.FIVE_MINUTES
    );
    const successPushNotification2WasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts successfully ran'
    );
    expect(successPushNotification2WasFound).toBe(true);

    // Run SFDX: Run Apex tests to verify fix
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Run Apex Tests', 1);

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    const successNotification2WasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotification2WasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    outputPanelText = await utilities.attemptToFindOutputPanelText('Apex', '=== Test Results', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('AccountServiceTest.should_create_account');
    expect(outputPanelText).toContain('Pass');
  });

  step('Create Apex Test Suite', async () => {
    // Run SFDX: Create Apex Test Suite.
    const workbench = await browser.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Apex Test Suite',
      1
    );

    // Set the name of the new Apex Test Suite
    await prompt.setText('ApexTestSuite');
    await prompt.confirm();
    await utilities.pause(2);

    // Choose tests that will belong to the new Apex Test Suite
    await browser.keys(['ArrowDown']);
    await browser.keys(['Space']);
    await prompt.confirm();

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Build Apex Test Suite',
      utilities.FIVE_MINUTES
    );

    // Look for the success notification that appears which says, "SFDX: Build Apex Test Suite successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Build Apex Test Suite successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);
  });

  step('Add test to Apex Test Suite', async () => {
    // Run SFDX: Add Tests to Apex Test Suite.
    const workbench = await browser.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Add Tests to Apex Test Suite',
      1
    );

    // Select the suite recently created called ApexTestSuite
    await prompt.selectQuickPick('ApexTestSuite');
    await utilities.pause(2);

    // Choose tests that will belong to the already created Apex Test Suite
    await browser.keys(['ArrowDown']);
    await browser.keys(['ArrowDown']);
    await browser.keys([' ']);
    await prompt.confirm();

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Build Apex Test Suite',
      utilities.FIVE_MINUTES
    );

    // Look for the success notification that appears which says, "SFDX: Build Apex Test Suite successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Build Apex Test Suite successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);
  });

  step('Run Apex Test Suite', async () => {
    const workbench = await browser.getWorkbench();

    // Run SFDX: Run Apex Test Suite.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Run Apex Test Suite', 1);

    // Select the suite recently created called ApexTestSuite
    await prompt.selectQuickPick('ApexTestSuite');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests',
      utilities.FIVE_MINUTES
    );
    // await utilities.waitForNotificationToGoAway(
    //   workbench,
    //   'Running SFDX: Run Apex Tests: Listening for streaming state changes...',
    //   utilities.FIVE_MINUTES
    // );
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Run Apex Tests: Processing test run',
      utilities.FIVE_MINUTES,
      false
    );

    // Look for the success notification that appears which says, "SFDX: Run Apex Tests successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Run Apex Tests successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Test Summary');
    expect(outputPanelText).toContain('TEST NAME');
    expect(outputPanelText).toContain('ended SFDX: Run Apex Tests');
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
