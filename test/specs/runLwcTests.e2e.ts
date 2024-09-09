/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TreeItem } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import path from 'path';
import { fail } from 'assert';

describe('Run LWC Tests', async () => {
  let testSetup: TestSetup;
  let projectFolderPath: string;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('RunLWCTests');
    await testSetup.setUp();
    projectFolderPath = testSetup.projectFolderPath!;

    // Create LWC1 and test
    await utilities.createLwc('lwc1');

    // Create LWC2 and test
    await utilities.createLwc('lwc2');

    // Install Jest unit testing tools for LWC
    await utilities.installJestUTToolsForLwc(testSetup.projectFolderPath);
  });

  step('SFDX: Run All Lightning Web Component Tests from Command Palette', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Run All Lightning Web Component Tests from Command Palette`
    );

    // Run SFDX: Run All Lightning Web Component Tests.
    await utilities.executeQuickPick(
      'SFDX: Run All Lightning Web Component Tests',
      utilities.Duration.seconds(1)
    );

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const workbench = await utilities.getWorkbench();
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(20)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`,
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 2 passed, 2 total',
      'Tests:       4 passed, 4 total',
      'Snapshots:   0 total',
      'Ran all test suites.'
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);
  });

  step('SFDX: Refresh Lightning Web Component Test Explorer', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Refresh Lightning Web Component Test Explorer`
    );
    await utilities.executeQuickPick(
      'Testing: Focus on LWC Tests View',
      utilities.Duration.seconds(1)
    );
    // Run command SFDX: Refresh Lightning Web Component Test Explorer
    await utilities.executeQuickPick(
      'SFDX: Refresh Lightning Web Component Test Explorer',
      utilities.Duration.seconds(2)
    );
    // Open the Tests Sidebar
    const workbench = await utilities.getWorkbench();
    const lwcTestsSection = await utilities.getTestsSection(workbench, 'LWC TESTS');
    let lwcTestsItems = (await lwcTestsSection.getVisibleItems()) as TreeItem[];

    // Run command SFDX: Run All Lightning Web Component Tests
    await utilities.executeQuickPick(
      'SFDX: Run All Lightning Web Component Tests',
      utilities.Duration.seconds(2)
    );

    // Get tree items again
    lwcTestsItems = (await lwcTestsSection.getVisibleItems()) as TreeItem[];

    // Verify the tests that ran are labeled with a green dot on the Test sidebar
    for (const item of lwcTestsItems) {
      await utilities.verifyTestIconColor(item, 'testPass');
    }

    // Run command SFDX: Refresh Lightning Web Component Test Explorer again to reset status
    await utilities.executeQuickPick(
      'SFDX: Refresh Lightning Web Component Test Explorer',
      utilities.Duration.seconds(2)
    );

    // Get tree items again
    lwcTestsItems = (await lwcTestsSection.getVisibleItems()) as TreeItem[];

    // Verify the tests are now labeled with a blue dot on the Test sidebar
    for (const item of lwcTestsItems) {
      await utilities.verifyTestIconColor(item, 'testNotRun');
    }
  });

  step('Run All tests via Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run All tests via Test Sidebar`);
    const workbench = await utilities.getWorkbench();
    const lwcTestsSection = await utilities.getTestsSection(workbench, 'LWC TESTS');
    const expectedItems = ['lwc1', 'lwc2', 'displays greeting', 'is defined'];
    const lwcTestsItems = await utilities.verifyTestItemsInSideBar(
      lwcTestsSection,
      'SFDX: Refresh Lightning Web Component Test Explorer',
      expectedItems,
      6,
      2
    );

    // Click the run tests button on the top right corner of the Test sidebar
    await lwcTestsSection.elem.click();
    const runTestsAction = await lwcTestsSection.getAction(
      'SFDX: Run All Lightning Web Component Tests'
    );
    await expect(runTestsAction).toBeDefined();
    await runTestsAction!.elem.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(15)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`,
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 2 passed, 2 total',
      'Tests:       4 passed, 4 total',
      'Snapshots:   0 total',
      'Ran all test suites.'
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    for (const item of lwcTestsItems) {
      await utilities.verifyTestIconColor(item, 'testPass');
    }
  });

  step('Run All Tests on a LWC via the Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run All Tests on a LWC via the Test Sidebar`);
    const workbench = await utilities.getWorkbench();

    // Click the run test button that is shown to the right when you hover a test class name on the Test sidebar
    const terminalText = await utilities.runTestCaseFromSideBar(
      workbench,
      'LWC TESTS',
      'lwc1',
      'SFDX: Run Lightning Web Component Test File'
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(
        projectFolderPath,
        'force-app',
        'main',
        'default',
        'lwc',
        'lwc1',
        '__tests__',
        'lwc1.test.js'
      )}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);
  });

  step('Run Single Test via the Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run Single Test via the Test Sidebar`);
    const workbench = await utilities.getWorkbench();

    // Hover a test name under one of the test lwc sections and click the run button that is shown to the right of the test name on the Test sidebar
    const terminalText = await utilities.runTestCaseFromSideBar(
      workbench,
      'LWC TESTS',
      'displays greeting',
      'SFDX: Run Lightning Web Component Test Case'
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       1 skipped, 1 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(
        projectFolderPath,
        'force-app',
        'main',
        'default',
        'lwc',
        'lwc2',
        '__tests__',
        'lwc2.test.js'
      )}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);
  });

  step('SFDX: Navigate to Lightning Web Component Test', async () => {
    // Verify that having clicked the test case took us to the test file.
    const workbench = await utilities.getWorkbench();
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    await expect(title).toBe('lwc2.test.js');
  });

  step('SFDX: Run Current Lightning Web Component Test File from Command Palette', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Run Current Lightning Web Component Test File`
    );

    // Run SFDX: Run Current Lightning Web Component Test File
    await utilities.executeQuickPick(
      'SFDX: Run Current Lightning Web Component Test File',
      utilities.Duration.seconds(1)
    );

    // Verify test results are listed on vscode's Output section
    // Also verify that all tests pass
    const workbench = await utilities.getWorkbench();
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(15)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(
        projectFolderPath,
        'force-app',
        'main',
        'default',
        'lwc',
        'lwc2',
        '__tests__',
        'lwc2.test.js'
      )}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);
  });

  xstep('Run All Tests via Code Lens action', async () => {
    // Skipping as this feature is currently not working
    utilities.log(`${testSetup.testSuiteSuffixName} - Run All Tests via Code Lens action`);
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc1.test.js');

    // Click the "Run" code lens at the top of the class
    const codeLens = await textEditor.getCodeLens('Run');
    const codeLensElem = await codeLens?.elem;
    const runAllTestsOption = await codeLensElem?.$('=Run');
    if (!runAllTestsOption) {
      fail('Could not find run all tests action button');
    }
    await runAllTestsOption.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(15)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(
        projectFolderPath,
        'force-app',
        'main',
        'default',
        'lwc',
        'lwc1',
        '__tests__',
        'lwc1.test.js'
      )}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);
  });

  step('Run Single Test via Code Lens action', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run Single Test via Code Lens action`);

    // Click the "Run Test" code lens at the top of one of the test methods
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc2.test.js');
    const codeLens = await textEditor.getCodeLens('Run Test');
    const codeLensElem = await codeLens?.elem;
    const runTestOption = await codeLensElem?.$('=Run Test');
    if (!runTestOption) {
      fail('Could not find run test action button');
    }
    await runTestOption.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(15)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       1 skipped, 1 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(
        projectFolderPath,
        'force-app',
        'main',
        'default',
        'lwc',
        'lwc2',
        '__tests__',
        'lwc2.test.js'
      )}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);
  });

  step('SFDX: Run Current Lightning Web Component Test File from main toolbar', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Run Current Lightning Web Component Test File from main toolbar`
    );

    // Run SFDX: Run Current Lightning Web Component Test File
    const runTestButtonToolbar = await utilities.findElementByText(
      'a',
      'aria-label',
      'SFDX: Run Current Lightning Web Component Test File'
    );
    await runTestButtonToolbar.click();

    // Verify test results are listed on vscode's Output section
    // Also verify that all tests pass
    const workbench = await utilities.getWorkbench();
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(15)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(
        projectFolderPath,
        'force-app',
        'main',
        'default',
        'lwc',
        'lwc2',
        '__tests__',
        'lwc2.test.js'
      )}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyTestResult(terminalText!, expectedTexts);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
