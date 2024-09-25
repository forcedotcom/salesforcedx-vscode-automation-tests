/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { SideBarView, TreeItem } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import path from 'path';
import { fail } from 'assert';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('Debug LWC Tests', async () => {
  let testSetup: TestSetup;
  let projectFolderPath: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'DebugLWCTests'
  }

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
    projectFolderPath = testSetup.projectFolderPath!;

    // Create LWC1 and test
    await utilities.createLwc('lwc1');

    // Create LWC2 and test
    await utilities.createLwc('lwc2');

    // Install Jest unit testing tools for LWC
    await utilities.installJestUTToolsForLwc(testSetup.projectFolderPath);
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    await utilities.showRunningExtensions();
    await utilities.zoom('Out', 4, utilities.Duration.seconds(1));
    // Verify Lightning Web Components extension is present and running
    const extensionWasFound = await utilities.verifyExtensionsAreRunning(
      utilities.getExtensionsToVerifyActive((ext) => ext.extensionId === 'salesforcedx-vscode-lwc')
    );
    await expect(extensionWasFound).toBe(true);
  });

  step('Debug All Tests on a LWC via the Test Sidebar', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Debug All tests on a LWC via the Test Sidebar`
    );
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick(
      'Testing: Focus on LWC Tests View',
      utilities.Duration.seconds(3)
    );

    // Open the Test Sidebar
    const lwcTestsSection = await utilities.getTestsSection(workbench, 'LWC TESTS');
    const expectedItems = ['lwc1', 'lwc2', 'displays greeting', 'is defined'];
    const lwcTestsItems = await utilities.verifyTestItemsInSideBar(
      lwcTestsSection,
      'SFDX: Refresh Lightning Web Component Test Explorer',
      expectedItems,
      6,
      2
    );

    // Click the debug test button that is shown to the right when you hover a test class name on the Test sidebar
    await lwcTestsItems[0].select();
    const debugTestsAction = await lwcTestsItems[0].getActionButton(
      'SFDX: Debug Lightning Web Component Test File'
    );
    await expect(debugTestsAction).toBeDefined();
    await debugTestsAction!.elem.click();
    await utilities.pause(utilities.Duration.seconds(10));

    // Continue with the debug session
    await utilities.continueDebugging();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(10)
    );
    const expectedTexts = [
      'PASS force-app/main/default/lwc/lwc1/__tests__/lwc1.test.js',
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(projectFolderPath, 'force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyOutputPanelText(terminalText!, expectedTexts);

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    await utilities.executeQuickPick(
      'Testing: Focus on LWC Tests View',
      utilities.Duration.seconds(3)
    );
    await utilities.verifyTestIconColor(lwcTestsItems[0], 'testPass');
  });

  step('Debug Single Test via the Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Debug Single Test via the Test Sidebar`);
    const workbench = await utilities.getWorkbench();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');
    await expect(testingView).not.toBeUndefined();
    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    await expect(testingSideBarView).toBeInstanceOf(SideBarView);

    // Hover a test name under one of the test lwc sections and click the debug button that is shown to the right of the test name on the Test sidebar
    const lwcTestsSection = await utilities.getTestsSection(workbench, 'LWC TESTS');
    const lwcTestItem = (await lwcTestsSection.findItem('displays greeting')) as TreeItem;
    await lwcTestItem.select();
    const debugTestAction = await lwcTestItem.getActionButton(
      'SFDX: Debug Lightning Web Component Test Case'
    );
    await expect(debugTestAction).toBeDefined();
    await debugTestAction!.elem.click();
    await utilities.pause(utilities.Duration.seconds(10));

    // Continue with the debug session
    await utilities.continueDebugging();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(10)
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
    await utilities.verifyOutputPanelText(terminalText!, expectedTexts);

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Testing: Focus on LWC Tests View',
      utilities.Duration.seconds(3)
    );
    await utilities.verifyTestIconColor(lwcTestItem, 'testPass');
  });

  step('SFDX: Debug Current Lightning Web Component Test File from Command Palette', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Debug Current Lightning Web Component Test File from Command Palette`
    );

    // Debug SFDX: Debug Current Lightning Web Component Test File
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick(
      'SFDX: Debug Current Lightning Web Component Test File',
      utilities.Duration.seconds(10)
    );

    // Continue with the debug session
    await utilities.continueDebugging();

    // Verify test results are listed on vscode's Output section
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(10)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(projectFolderPath, 'force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyOutputPanelText(terminalText!, expectedTexts);
  });

  xstep('Debug All Tests via Code Lens action', async () => {
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc1.test.js');

    // Click the "Debug" code lens at the top of the class
    const codeLens = await textEditor.getCodeLens('Debug');
    const codeLensElem = await codeLens?.elem;
    const debugAllTestsOption = await codeLensElem?.$('=Debug');
    if (!debugAllTestsOption) {
      fail('Could not find debug test action button');
    }
    await debugAllTestsOption.click();
    await utilities.pause(utilities.Duration.seconds(10));

    // Continue with the debug session
    await utilities.continueDebugging();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(10)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(projectFolderPath, 'force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyOutputPanelText(terminalText!, expectedTexts);
  });

  step('Debug Single Test via Code Lens action', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Debug Single Test via Code Lens action`);

    // Click the "Debug Test" code lens at the top of one of the test methods
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc2.test.js');
    await browser.keys([CMD_KEY, 'ArrowUp']);
    const codeLens = await textEditor.getCodeLens('Run Test');
    const codeLensElem = await codeLens?.elem;
    const debugTestOption = await codeLensElem?.$('=Debug Test');
    if (!debugTestOption) {
      fail('Could not find debug test action button');
    }
    await debugTestOption.click();
    await utilities.pause(utilities.Duration.seconds(10));

    // Continue with the debug session
    await utilities.continueDebugging();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(10)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       1 skipped, 1 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(projectFolderPath, 'force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyOutputPanelText(terminalText!, expectedTexts);
  });

  step('SFDX: Debug Current Lightning Web Component Test File from main toolbar', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Debug Current Lightning Web Component Test File from main toolbar`
    );

    // Debug SFDX: Debug Current Lightning Web Component Test File
    const debugTestButtonToolbar = await utilities.findElementByText(
      'a',
      'aria-label',
      'SFDX: Debug Current Lightning Web Component Test File'
    );
    await debugTestButtonToolbar.click();
    await utilities.pause(utilities.Duration.seconds(10));

    // Continue with the debug session
    await utilities.continueDebugging();

    // Verify test results are listed on vscode's Output section
    // Also verify that all tests pass
    const workbench = await utilities.getWorkbench();
    const terminalText = await utilities.getTerminalViewText(
      workbench,
      utilities.Duration.seconds(10)
    );
    const expectedTexts = [
      `PASS ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`,
      'Test Suites: 1 passed, 1 total',
      'Tests:       2 passed, 2 total',
      'Snapshots:   0 total',
      `Ran all test suites within paths "${path.join(projectFolderPath, 'force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}"`
    ];
    await expect(terminalText).toBeDefined();
    await utilities.verifyOutputPanelText(terminalText!, expectedTexts);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
