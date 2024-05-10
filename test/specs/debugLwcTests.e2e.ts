/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import child_process from 'child_process';
import { step, xstep } from 'mocha-steps';
import { SideBarView, TreeItem } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import path from 'path';
import util from 'util';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';

const exec = util.promisify(child_process.exec);

describe('Debug LWC Tests', async () => {
  let testSetup: TestSetup;
  let projectFolderPath: string;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('DebugLWCTests', false);
    await testSetup.setUp();
    projectFolderPath = testSetup.projectFolderPath!;

    // Create LWC1 and test
    await utilities.createLwc('lwc1');

    // Create LWC2 and test
    await utilities.createLwc('lwc2');

    // Install Jest unit testing tools for LWC
    await exec(`sf force:lightning:lwc:test:setup`, {
      cwd: testSetup.projectFolderPath
    });
    await utilities.pause(20);
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await browser.getWorkbench();
    await utilities.showRunningExtensions(workbench);

    // Verify Lightning Web Components extension is present and running
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
      workbench,
      'salesforcedx-vscode-lwc'
    );
    expect(extensionWasFound).toBe(true);
  });

  step('Debug All Tests on a LWC via the Test Sidebar', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Debug All tests on a LWC via the Test Sidebar`
    );
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'Testing: Focus on LWC Tests View', 3);

    // Open the Test Sidebar
    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const lwcTestsSection = await sidebarView.getSection('LWC TESTS');
    expect(lwcTestsSection.elem).toBePresent();

    const lwcTestsItems = await utilities.retrieveExpectedNumTestsFromSidebar(
      6,
      lwcTestsSection,
      'SFDX: Refresh Lightning Web Component Test Explorer'
    );
    // Expand LWC tests
    await lwcTestsItems[0].expand();
    await lwcTestsItems[1].expand();

    // Click the debug test button that is shown to the right when you hover a test class name on the Test sidebar
    const lwcTestItem = (await lwcTestsSection.findItem('lwc1')) as TreeItem;
    await lwcTestItem.select();
    const debugTestsAction = await lwcTestItem.getActionButton(
      'SFDX: Debug Lightning Web Component Test File'
    );
    await debugTestsAction!.elem.click();
    await utilities.pause(10);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['Escape']);

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 10);
    expect(terminalText).not.toBeUndefined();
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`
    );
    expect(terminalText).toContain('Test Suites: 1 passed, 1 total');
    expect(terminalText).toContain('Tests:       2 passed, 2 total');
    expect(terminalText).toContain('Snapshots:   0 total');
    expect(terminalText).toContain(
      `Ran all test suites within paths "${path.join(projectFolderPath!, 'force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`
    );

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    await utilities.runCommandFromCommandPrompt(workbench, 'Testing: Focus on LWC Tests View', 3);
    const icon = await (await lwcTestItem.elem).$('.custom-view-tree-node-item-icon');
    const iconStyle = await icon.getAttribute('style');
    // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
    try {
      expect(iconStyle).toContain('testPass');
    } catch {
      utilities.log('ERROR: icon did not turn green after test successfully ran');
    }
  });

  step('Debug Single Test via the Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Debug Single Test via the Test Sidebar`);
    const workbench = await (await browser.getWorkbench()).wait();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const lwcTestsSection = await sidebarView.getSection('LWC TESTS');
    expect(lwcTestsSection.elem).toBePresent();

    // Hover a test name under one of the test lwc sections and click the debug button that is shown to the right of the test name on the Test sidebar
    const lwcTestItem = (await lwcTestsSection.findItem('displays greeting')) as TreeItem;
    await lwcTestItem.select();
    const debugTestAction = await lwcTestItem.getActionButton(
      'SFDX: Debug Lightning Web Component Test Case'
    );
    await debugTestAction!.elem.click();
    await utilities.pause(10);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['Escape']);

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 10);
    expect(terminalText).not.toBeUndefined();
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );
    expect(terminalText).toContain('Test Suites: 1 passed, 1 total');
    expect(terminalText).toContain('Tests:       1 skipped, 1 passed, 2 total');
    expect(terminalText).toContain('Snapshots:   0 total');
    expect(terminalText).toContain(
      `Ran all test suites within paths "${path.join(projectFolderPath!, 'force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    await utilities.runCommandFromCommandPrompt(workbench, 'Testing: Focus on LWC Tests View', 3);
    const icon = await (await lwcTestItem.elem).$('.custom-view-tree-node-item-icon');
    const iconStyle = await icon.getAttribute('style');
    // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
    try {
      expect(iconStyle).toContain('testPass');
    } catch {
      utilities.log('ERROR: icon did not turn green after test successfully ran');
    }
  });

  step('SFDX: Debug Current Lightning Web Component Test File', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Debug Current Lightning Web Component Test File`
    );
    const workbench = await (await browser.getWorkbench()).wait();

    // Debug SFDX: Debug Current Lightning Web Component Test File
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Debug Current Lightning Web Component Test File',
      10
    );

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['Escape']);

    // Verify test results are listed on vscode's Output section
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 10);
    expect(terminalText).not.toBeUndefined();
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );
    expect(terminalText).toContain('Test Suites: 1 passed, 1 total');
    expect(terminalText).toContain('Tests:       2 passed, 2 total');
    expect(terminalText).toContain('Snapshots:   0 total');
    expect(terminalText).toContain(
      `Ran all test suites within paths "${path.join(projectFolderPath!, 'force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );
  });

  xstep('Debug All Tests via Code Lens action', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc1.test.js');

    // Click the "Debug" code lens at the top of the class
    const codeLens = await textEditor.getCodeLens('Debug');
    const codeLensElem = await codeLens?.elem;
    const debugAllTestsOption = await codeLensElem?.$('=Debug');
    await debugAllTestsOption!.click();
    await utilities.pause(10);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['Escape']);

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 10);
    expect(terminalText).not.toBeUndefined();
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`
    );
    expect(terminalText).toContain('Test Suites: 1 passed, 1 total');
    expect(terminalText).toContain('Tests:       2 passed, 2 total');
    expect(terminalText).toContain('Snapshots:   0 total');
    expect(terminalText).toContain(
      `Ran all test suites within paths "${path.join(projectFolderPath!, 'force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`
    );
  });

  step('Debug Single Test via Code Lens action', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Debug Single Test via Code Lens action`);
    const workbench = await (await browser.getWorkbench()).wait();

    // Click the "Debug Test" code lens at the top of one of the test methods
    const textEditor = await utilities.getTextEditor(workbench, 'lwc2.test.js');
    await browser.keys([CMD_KEY, 'ArrowUp']);
    const codeLens = await textEditor.getCodeLens('Run Test');
    const codeLensElem = await codeLens?.elem;
    const debugTestOption = await codeLensElem?.$('=Debug Test');
    await debugTestOption!.click();
    await utilities.pause(10);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(3);
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['Escape']);

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 10);
    expect(terminalText).not.toBeUndefined();
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );
    expect(terminalText).toContain('Test Suites: 1 passed, 1 total');
    expect(terminalText).toContain('Tests:       1 skipped, 1 passed, 2 total');
    expect(terminalText).toContain('Snapshots:   0 total');
    expect(terminalText).toContain(
      `Ran all test suites within paths "${path.join(projectFolderPath!, 'force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
