/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { InputBox, QuickOpenBox, TextEditor } from 'wdio-vscode-service';
import { refactoredTestSetup } from '../refactoredTestSetup.ts';
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

/**
 * This test suite walks through the same steps performed in the "Find and Fix Bugs with Apex Replay Debugger" Trailhead Module;
 * which can be found with the following link:
 * https://trailhead.salesforce.com/content/learn/projects/find-and-fix-bugs-with-apex-replay-debugger
 */
describe('"Find and Fix Bugs with Apex Replay Debugger" Trailhead Module', async () => {
  let prompt: QuickOpenBox | InputBox;
  const testSetup = new refactoredTestSetup();
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'TrailApexReplayDebugger'
  }

  step('Set up the testing environment', async () => {
    await testSetup.setUp(testReqConfig);

    // Create Apex class AccountService
    await utilities.createApexClassWithBugs();

    // Push source to org
    await utilities.executeQuickPick(
      'SFDX: Push Source to Default Org and Ignore Conflicts',
      utilities.Duration.seconds(1)
    );

    const successPushNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Push Source to Default Org and Ignore Conflicts successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successPushNotificationWasFound).toBe(true);
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get Apex LSP Status Bar
    const statusBar = await utilities.getStatusBarItemWhichIncludes('Editor Language Status');
    await statusBar.click();
    await expect(await statusBar.getAttribute('aria-label')).toContain('Indexing complete');
  });

  step('Run Apex Tests', async () => {
    // Run SFDX: Run Apex tests.
    await utilities.clearOutputView();
    prompt = await utilities.executeQuickPick(
      'SFDX: Run Apex Tests',
      utilities.Duration.seconds(1)
    );

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Run Apex Tests successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('Assertion Failed: incorrect ticker symbol');
    await expect(outputPanelText).toContain('Expected: CRM, Actual: SFDC');
  });

  step('Set Breakpoints and Checkpoints', async () => {
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'AccountService.cls');

    // Move cursor to return line
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(['return']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await utilities.pause(utilities.Duration.seconds(1));

    // Run SFDX: Toggle Checkpoint.
    prompt = await utilities.executeQuickPick(
      'SFDX: Toggle Checkpoint',
      utilities.Duration.seconds(1)
    );

    // Switch back to the AccountService.cls tab
    await utilities.getTextEditor(workbench, 'AccountService.cls');

    // Verify checkpoint is present
    const breakpoints = await $$('.codicon-debug-breakpoint-conditional');
    await expect(breakpoints.length).toEqual(1);

    // Run SFDX: Update Checkpoints in Org.
    prompt = await utilities.executeQuickPick(
      'SFDX: Update Checkpoints in Org',
      utilities.Duration.seconds(20)
    );
    // Verify checkpoints updating results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex Replay Debugger',
      'Starting SFDX: Update Checkpoints in Org',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain(
      'SFDX: Update Checkpoints in Org, Step 6 of 6: Confirming successful checkpoint creation'
    );
    await expect(outputPanelText).toContain('Ending SFDX: Update Checkpoints in Org');
  });

  step('SFDX: Turn On Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn On Apex Debug Log for Replay Debugger
    await utilities.clearOutputView();
    await utilities.executeQuickPick(
      'SFDX: Turn On Apex Debug Log for Replay Debugger',
      utilities.Duration.seconds(10)
    );

    // Look for the success notification that appears which says, "SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Turn On Apex Debug Log for Replay Debugger',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('SFDX: Turn On Apex Debug Log for Replay Debugger ');
    await expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Run Apex Tests', async () => {
    // Run SFDX: Run Apex tests.
    await utilities.clearOutputView();
    prompt = await utilities.executeQuickPick(
      'SFDX: Run Apex Tests',
      utilities.Duration.seconds(1)
    );

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Run Apex Tests successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('Assertion Failed: incorrect ticker symbol');
    await expect(outputPanelText).toContain('Expected: CRM, Actual: SFDC');
  });

  step('SFDX: Get Apex Debug Logs', async () => {
    // Run SFDX: Get Apex Debug Logs
    const workbench = await utilities.getWorkbench();
    prompt = await utilities.executeQuickPick(
      'SFDX: Get Apex Debug Logs',
      utilities.Duration.seconds(1)
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      'Getting Apex debug logs',
      utilities.Duration.TEN_MINUTES
    );

    // Select a log file
    const quickPicks = await prompt.getQuickPicks();
    await expect(quickPicks).not.toBeUndefined();
    await expect(quickPicks.length).toBeGreaterThanOrEqual(1);
    await prompt.selectQuickPick('User User - ApexTestHandler');

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Get Apex Debug Logs successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      'Starting SFDX: Get Apex Debug Logs',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('|EXECUTION_STARTED');
    await expect(outputPanelText).toContain('|EXECUTION_FINISHED');
    await expect(outputPanelText).toContain('ended SFDX: Get Apex Debug Logs');

    // Verify content on log file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    const textEditor = (await editorView.openEditor(title!)) as TextEditor;
    const executionStarted = await textEditor.getLineOfText('|EXECUTION_STARTED');
    const executionFinished = await textEditor.getLineOfText('|EXECUTION_FINISHED');
    await expect(executionStarted).toBeGreaterThanOrEqual(1);
    await expect(executionFinished).toBeGreaterThanOrEqual(1);
  });

  step('Replay an Apex Debug Log', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    await utilities.executeQuickPick(
      'SFDX: Launch Apex Replay Debugger with Current File',
      utilities.Duration.seconds(5)
    );

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(['F5']);
    await utilities.pause(utilities.Duration.seconds(1));
  });

  step('Push Fixed Metadata to Org', async () => {
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'AccountService.cls');
    await textEditor.setTextAtLine(6, '\t\t\tTickerSymbol = tickerSymbol');
    await textEditor.save();
    await utilities.pause(utilities.Duration.seconds(2));

    // Push source to org
    await utilities.executeQuickPick(
      'SFDX: Push Source to Default Org and Ignore Conflicts',
      utilities.Duration.seconds(1)
    );

    const successPushNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Push Source to Default Org and Ignore Conflicts successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successPushNotificationWasFound).toBe(true);
  });

  step('Run Apex Tests to Verify Fix', async () => {
    // Run SFDX: Run Apex tests.
    await utilities.clearOutputView();
    prompt = await utilities.executeQuickPick(
      'SFDX: Run Apex Tests',
      utilities.Duration.seconds(1)
    );

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Run Apex Tests successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      '=== Test Results',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('AccountServiceTest.should_create_account');
    await expect(outputPanelText).toContain('Pass');
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
