/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TreeItem, Workbench, SideBarView, ViewSection } from 'wdio-vscode-service';
import { Duration, log, pause } from './miscellaneous.ts';
import { attemptToFindOutputPanelText } from './outputView.ts';
import { notificationIsPresentWithTimeout } from './notifications.ts';
import { getTerminalViewText } from './terminalView.ts';
import { fail } from 'assert';

const CONTINUE = 'F5';

export async function retrieveExpectedNumTestsFromSidebar(
  expectedNumTests: number,
  testsSection: ViewSection,
  actionLabel: string
): Promise<TreeItem[]> {
  let testsItems = (await testsSection.getVisibleItems()) as TreeItem[];
  await browser.keys(['Escape']);

  // If the tests did not show up, click the refresh button on the top right corner of the Test sidebar
  for (let x = 0; x < 3; x++) {
    if (testsItems.length === 1) {
      await testsSection.elem.click();
      const refreshAction = await testsSection.getAction(actionLabel);
      if (!refreshAction) {
        fail('Could not find test action button');
      }
      await refreshAction.elem.click();
      await pause(Duration.seconds(10));
      testsItems = (await testsSection.getVisibleItems()) as TreeItem[];
    } else if (testsItems.length === expectedNumTests) {
      break;
    }
  }

  return testsItems;
}

export async function getTestsSection(workbench: Workbench, type: string) {
  const sidebar = workbench.getSideBar();
  const sidebarView = sidebar.getContent();
  const testsSection = await sidebarView.getSection(type);
  await expect(testsSection.elem).toBePresent();
  return testsSection;
}

/**
 * Runs a test case from the sidebar and returns the test result.
 * *
 * @param {Workbench} workbench - The workbench instance used to interact with the sidebar and views.
 * @param {string} testSuite - The name of the test suite from which to run the test (e.g., 'APEX TESTS', 'LWC TESTS').
 * @param {string} testName - The name of the specific test case to run.
 * @param {string} actionLabel - The label of the action button to click (e.g., 'SFDX: Run Apex Tests', 'Debug').
 *
 * @example
 * const result = await runTestCaseFromSideBar(
 *   myWorkbench,
 *   'APEX TESTS',
 *   'MyApexTestCase',
 *   'SFDX: Run Apex Tests'
 * );
 * console.log(result); // Outputs the result from the Apex test run
 */
export async function runTestCaseFromSideBar(
  workbench: Workbench,
  testSuite: string,
  testName: string,
  actionLabel: string
): Promise<string | undefined> {
  log(`Running ${testSuite} - ${testName} - ${actionLabel} from SideBar`);
  const testingView = await workbench.getActivityBar().getViewControl('Testing');
  await expect(testingView).not.toBeUndefined();

  // Open the Test Sidebar
  const testingSideBarView = await testingView?.openView();
  await expect(testingSideBarView).toBeInstanceOf(SideBarView);

  // Select test
  const testSection = await getTestsSection(workbench, testSuite);
  const testItem = (await testSection.findItem(testName)) as TreeItem;
  await expect(testItem).toBePresent();
  await testItem.select();

  // Click button to run test
  const actionButton = await testItem.getActionButton(actionLabel);
  await expect(actionButton).toBePresent();
  await actionButton?.elem.click();

  if (actionLabel.includes('Debug')) {
    await pause(Duration.seconds(10));

    // Continue with the debug session
    await continueDebugging();
  }

  let testResult: string | undefined;
  if (testSuite === 'APEX TESTS') {
    // Look for the success notification that appears which says, "SFDX: Run Apex Tests successfully ran".
    const successNotificationWasFound = await notificationIsPresentWithTimeout(
      'SFDX: Run Apex Tests successfully ran',
      Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);
    testResult = await attemptToFindOutputPanelText('Apex', '=== Test Results', 10);
  } else if (testSuite === 'LWC TESTS') {
    testResult = await getTerminalViewText(workbench, Duration.seconds(15));
  }
  await verifyTestIconColor(testItem, 'testPass');
  return testResult;
}

/**
 * Verifies the color of the test icon in the sidebar to ensure it reflects the correct test status.
 *
 * @param {TreeItem} testItem - The test item whose icon color needs to be verified. It represents a node in the sidebar tree view.
 * @param {string} colorLabel - The expected color label (e.g., 'testPass', 'testNotRun') that indicates the test status.
 *
 * @example
 * await verifyTestIconColor(myTestItem, 'testPass'); // Verifies the icon is green for a passing test
 */
export async function verifyTestIconColor(testItem: TreeItem, colorLabel: string) {
  log(`Verifying icon's colors - verifyTestIconColor()`);
  // Verify the tests that are passing are labeled with a green dot on the Test sidebar
  const icon = await (await testItem.elem).$('.custom-view-tree-node-item-icon');
  const iconStyle = await icon.getAttribute('style');
  // Try/catch used to get around arbitrary flaky failure on Ubuntu in remote
  try {
    await expect(iconStyle).toContain(colorLabel);
  } catch {
    log('ERROR: icon did not turn green after test successfully ran');
  }
}

/**
 * Verifies that the test result contains all expected text snippets.
 *
 * @param {string} testResult - The actual test result as a string that needs to be verified.
 * @param {string[]} expectedTexts - An array of strings representing the expected text snippets that should be present in the test result.
 *
 * @example
 * await verifyTestResult(
 *   testResult,
 *   [
 *     '=== Test Summary',
 *     'Outcome              Passed',
 *     'Tests Ran            1',
 *     'Pass Rate            100%',
 *     'TEST NAME',
 *     'ExampleTest1  Pass',
 *     'ended SFDX: Run Apex Tests'
 *   ]
 * );
 */
export async function verifyTestResult(testResult: string, expectedTexts: string[]): Promise<void> {
  for (const expectedText of expectedTexts) {
    await expect(testResult).toContain(expectedText);
  }
}

/**
 * Verifies the presence of test items in the sidebar.
 * *
 * @param {ViewSection} testsSection - An instance of the view section representing the sidebar where test items are displayed.
 * @param {string} refreshCommand - The command used to refresh the sidebar to ensure it displays up-to-date information.
 * @param {string[]} expectedItems - An array of strings representing the expected test items that should be present in the sidebar.
 * @param {number} expectedTests - The expected number of tests to be displayed in the sidebar.
 * @param {number} expectedClasses - The expected number of test classes to be present in the sidebar.
 *
 * @returns {Promise<void>} A promise that resolves when the verification is complete.
 *
 * @example
 * await verifyTestItemsInSideBar(
 *   mySidebarSection,
 *   'Refresh Tests',
 *   ['Test Item 1', 'Test Item 2'],
 *   2,
 *   1
 * );
 */
export async function verifyTestItemsInSideBar(
  testsSection: ViewSection,
  refreshCommand: string,
  expectedItems: string[],
  expectedTests: number,
  expectedClasses: number
) {
  const testsItems = await retrieveExpectedNumTestsFromSidebar(
    expectedTests,
    testsSection,
    refreshCommand
  );
  const isLWCSection = (await testsSection.getTitle()) === 'LWC TESTS';
  if (isLWCSection) {
    // Expand tests
    for (let x = 0; x < expectedClasses; x++) {
      await testsItems[x].expand();
    }
  }

  // Make sure all the tests are present in the sidebar
  await expect(testsItems.length).toBe(isLWCSection ? expectedClasses : expectedTests);
  for (const item of expectedItems) {
    await expect(await testsSection.findItem(item)).toBeTruthy();
  }
  return testsItems;
}

export async function continueDebugging(): Promise<void> {
  // Continue with the debug session
  await browser.keys(CONTINUE);
  await pause(Duration.seconds(3));
  await browser.keys(CONTINUE);
  await pause(Duration.seconds(3));
  await browser.keys(CONTINUE);
  await pause(Duration.seconds(1));
  await browser.keys('Escape');
}
