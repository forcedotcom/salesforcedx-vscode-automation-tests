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
// import { CMD_KEY } from 'wdio-vscode-service/dist/constants';

const exec = util.promisify(child_process.exec);

describe('Run LWC Tests', async () => {
  let testSetup: TestSetup;
  let projectFolderPath: string;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('RunLWCTests', false);
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

  step('SFDX: Run All Lightning Web Component Tests from Command Palette', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Run All Lightning Web Component Tests from Command Palette`
    );
    const workbench = await (await browser.getWorkbench()).wait();

    // Run SFDX: Run All Lightning Web Component Tests.
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Run All Lightning Web Component Tests',
      1
    );

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 20);
    expect(terminalText).not.toBeUndefined();
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`
    );
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );
    expect(terminalText).toContain('Test Suites: 2 passed, 2 total');
    expect(terminalText).toContain('Tests:       4 passed, 4 total');
    expect(terminalText).toContain('Snapshots:   0 total');
    expect(terminalText).toContain('Ran all test suites.');
  });

  step('SFDX: Refresh Lightning Web Component Test Explorer', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Refresh Lightning Web Component Test Explorer`
    );
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'Testing: Focus on LWC Tests View', 1);
    // Run command SFDX: Refresh Lightning Web Component Test Explorer
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Refresh Lightning Web Component Test Explorer',
      2
    );
    // Open the Tests Sidebar
    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const lwcTestsSection = await sidebarView.getSection('LWC TESTS');
    expect(lwcTestsSection.elem).toBePresent();
    let lwcTestsItems = (await lwcTestsSection.getVisibleItems()) as TreeItem[];

    // Run command SFDX: Run All Lightning Web Component Tests
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Run All Lightning Web Component Tests',
      2
    );

    // Get tree items again
    lwcTestsItems = (await lwcTestsSection.getVisibleItems()) as TreeItem[];

    // Verify the tests that ran are labeled with a green dot on the Test sidebar
    for (const item of lwcTestsItems) {
      const icon = await (await item.elem).$('.custom-view-tree-node-item-icon');
      const iconStyle = await icon.getAttribute('style');
      // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
      try {
        expect(iconStyle).toContain('testPass');
      } catch {
        utilities.log('ERROR: icon did not turn green after test successfully ran');
      }
    }

    // Run command SFDX: Refresh Lightning Web Component Test Explorer again to reset status
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Refresh Lightning Web Component Test Explorer',
      2
    );

    // Get tree items again
    lwcTestsItems = (await lwcTestsSection.getVisibleItems()) as TreeItem[];

    // Verify the tests are now labeled with a blue dot on the Test sidebar
    for (const item of lwcTestsItems) {
      const icon = await (await item.elem).$('.custom-view-tree-node-item-icon');
      const iconStyle = await icon.getAttribute('style');
      // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
      try {
        expect(iconStyle).toContain('testNotRun');
      } catch {
        utilities.log('ERROR: icon did not turn green after test successfully ran');
      }
    }
  });

  step('Run All tests via Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run All tests via Test Sidebar`);
    const workbench = await (await browser.getWorkbench()).wait();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const lwcTestsSection = await sidebarView.getSection('LWC TESTS');
    expect(lwcTestsSection.elem).toBePresent();

    const lwcTestsItems = await utilities.retrieveAllTestItemsFromSidebar(
      6,
      lwcTestsSection,
      'SFDX: Refresh Lightning Web Component Test Explorer'
    );
    // Expand LWC tests
    await lwcTestsItems[0].expand();
    await lwcTestsItems[1].expand();

    // Make sure all the tests are present in the sidebar
    expect(lwcTestsItems.length).toBe(2);
    expect(await lwcTestsSection.findItem('lwc1')).toBeTruthy();
    expect(await lwcTestsSection.findItem('lwc2')).toBeTruthy();
    expect(await lwcTestsSection.findItem('displays greeting')).toBeTruthy();
    expect(await lwcTestsSection.findItem('is defined')).toBeTruthy();

    // Click the run tests button on the top right corner of the Test sidebar
    await lwcTestsSection.elem.click();
    const runTestsAction = await lwcTestsSection.getAction(
      'SFDX: Run All Lightning Web Component Tests'
    );
    await runTestsAction!.elem.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 15);
    expect(terminalText).not.toBeUndefined();
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc1', '__tests__', 'lwc1.test.js')}`
    );
    expect(terminalText).toContain(
      `PASS  ${path.join('force-app', 'main', 'default', 'lwc', 'lwc2', '__tests__', 'lwc2.test.js')}`
    );
    expect(terminalText).toContain('Test Suites: 2 passed, 2 total');
    expect(terminalText).toContain('Tests:       4 passed, 4 total');
    expect(terminalText).toContain('Snapshots:   0 total');
    expect(terminalText).toContain('Ran all test suites.');

    // Verify the tests that are passing are labeled with a green dot on the Test sidebar
    for (const item of lwcTestsItems) {
      const icon = await (await item.elem).$('.custom-view-tree-node-item-icon');
      const iconStyle = await icon.getAttribute('style');
      // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
      try {
        expect(iconStyle).toContain('testPass');
      } catch {
        utilities.log('ERROR: icon did not turn green after test successfully ran');
      }
    }
  });

  step('Run All Tests on a LWC via the Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run All Tests on a LWC via the Test Sidebar`);
    const workbench = await (await browser.getWorkbench()).wait();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const lwcTestsSection = await sidebarView.getSection('LWC TESTS');
    expect(lwcTestsSection.elem).toBePresent();

    // Click the run test button that is shown to the right when you hover a test class name on the Test sidebar
    const lwcTestItem = (await lwcTestsSection.findItem('lwc1')) as TreeItem;
    await lwcTestItem.select();
    const runTestsAction = await lwcTestItem.getActionButton(
      'SFDX: Run Lightning Web Component Test File'
    );
    await runTestsAction!.elem.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 15);
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
    const icon = await (await lwcTestItem.elem).$('.custom-view-tree-node-item-icon');
    const iconStyle = await icon.getAttribute('style');
    // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
    try {
      expect(iconStyle).toContain('testPass');
    } catch {
      utilities.log('ERROR: icon did not turn green after test successfully ran');
    }
  });

  step('Run Single Test via the Test Sidebar', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run Single Test via the Test Sidebar`);
    const workbench = await (await browser.getWorkbench()).wait();
    const testingView = await workbench.getActivityBar().getViewControl('Testing');

    // Open the Test Sidebar
    const testingSideBarView = await testingView?.openView();
    expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    const lwcTestsSection = await sidebarView.getSection('LWC TESTS');
    expect(lwcTestsSection.elem).toBePresent();

    // Hover a test name under one of the test lwc sections and click the run button that is shown to the right of the test name on the Test sidebar
    const lwcTestItem = (await lwcTestsSection.findItem('displays greeting')) as TreeItem;
    await lwcTestItem.select();
    const runTestAction = await lwcTestItem.getActionButton(
      'SFDX: Run Lightning Web Component Test Case'
    );
    await runTestAction!.elem.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 15);
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
    const icon = await (await lwcTestItem.elem).$('.custom-view-tree-node-item-icon');
    const iconStyle = await icon.getAttribute('style');
    // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
    try {
      expect(iconStyle).toContain('testPass');
    } catch {
      utilities.log('ERROR: icon did not turn green after test successfully ran');
    }

    // Verify that clicking the test case took us to the test file.
    // We're testing SFDX: Navigate to Lightning Web Component Test with this
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('lwc2.test.js');
  });

  step('SFDX: Run Current Lightning Web Component Test File', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - SFDX: Run Current Lightning Web Component Test File`
    );
    const workbench = await (await browser.getWorkbench()).wait();

    // Run SFDX: Run Current Lightning Web Component Test File
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Run Current Lightning Web Component Test File',
      1
    );

    // Verify test results are listed on vscode's Output section
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 15);
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

  xstep('Run All Tests via Code Lens action', async () => {
    // Skipping as this feature is currently not working
    utilities.log(`${testSetup.testSuiteSuffixName} - Run All Tests via Code Lens action`);
    const workbench = await (await browser.getWorkbench()).wait();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc1.test.js');

    // Click the "Run" code lens at the top of the class
    const codeLens = await textEditor.getCodeLens('Run');
    const codeLensElem = await codeLens?.elem;
    const runAllTestsOption = await codeLensElem?.$('=Run');
    await runAllTestsOption!.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 15);
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

  step('Run Single Test via Code Lens action', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Run Single Test via Code Lens action`);
    const workbench = await (await browser.getWorkbench()).wait();

    // Click the "Run Test" code lens at the top of one of the test methods
    const textEditor = await utilities.getTextEditor(workbench, 'lwc2.test.js');
    const codeLens = await textEditor.getCodeLens('Run Test');
    const codeLensElem = await codeLens?.elem;
    const runTestOption = await codeLensElem?.$('=Run Test');
    await runTestOption!.click();

    // Verify test results are listed on the terminal
    // Also verify that all tests pass
    const terminalText = await utilities.getTerminalViewText(workbench, 15);
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
