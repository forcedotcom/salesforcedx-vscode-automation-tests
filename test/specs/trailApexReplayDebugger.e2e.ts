/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import {
  InputBox,
  QuickOpenBox,
  TextEditor
} from 'wdio-vscode-service';
import {
  TestSetup
} from '../testSetup';
import * as utilities from '../utilities';

/**
 * This test suite walks through the same steps performed in the "Find and Fix Bugs with Apex Replay Debugger" Trailhead Module;
 * which can be found with the following link:
 * https://trailhead.salesforce.com/content/learn/projects/find-and-fix-bugs-with-apex-replay-debugger
 */
describe('"Find and Fix Bugs with Apex Replay Debugger" Trailhead Module', async () => {
  let prompt: QuickOpenBox | InputBox;
  let testSetup: TestSetup;
  const fiveMinutes = 5 * 60;

  step('Set up the testing environment', async () => {
    // utilities.log(`${testSetup.testSuiteSuffixName} - Set up the testing environment`);
    utilities.log('TrailApexReplayDebugger - Set up the testing environment');

    testSetup = new TestSetup('TrailApexReplayDebugger', false);
    await testSetup.setUp();

    utilities.log('TrailApexReplayDebugger - finished calling testSetup.setUp()');
    utilities.log('TrailApexReplayDebugger - calling utilities.createApexClassWithBugs()');

    // Create Apex class AccountService
    await utilities.createApexClassWithBugs();

    utilities.log('TrailApexReplayDebugger - finished calling utilities.createApexClassWithBugs()');
    utilities.log('TrailApexReplayDebugger - calling browser.getWorkbench()');

    // Push source to org
    const workbench = await utilities.getWorkbench();

    utilities.log('TrailApexReplayDebugger - finished calling browser.getWorkbench()');
    utilities.log('TrailApexReplayDebugger - calling runCommandFromCommandPrompt()');

    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Org and Override Conflicts', 1);

    utilities.log('TrailApexReplayDebugger - finished calling runCommandFromCommandPrompt()');
    utilities.log('TrailApexReplayDebugger - calling waitForNotificationToGoAway()');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Push Source to Default Org and Override Conflicts', fiveMinutes);

    utilities.log('TrailApexReplayDebugger - finished calling waitForNotificationToGoAway()');
    utilities.log('TrailApexReplayDebugger - calling notificationIsPresent()');

    const successPushNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Push Source to Default Org and Override Conflicts successfully ran');

    utilities.log('TrailApexReplayDebugger - finished calling notificationIsPresent()');

    expect(successPushNotificationWasFound).toBe(true);

    utilities.log('TrailApexReplayDebugger - "Set up the testing environment" has completed');
  });

  step('Run Apex Tests', async () => {
    // Run SFDX: Run Apex tests.
    const workbench = await utilities.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Run Apex Tests', 1);

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests', fiveMinutes);
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests: Listening for streaming state changes...', fiveMinutes);
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests: Processing test run', fiveMinutes, false);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Run Apex Tests successfully ran');
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Apex', '=== Test Results', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Assertion Failed: incorrect ticker symbol');
    expect(outputPanelText).toContain('Expected: CRM, Actual: SFDC');
  });

  step('Set Breakpoints and Checkpoints', async () => {
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = await editorView.openEditor('AccountService.cls') as TextEditor;
    await textEditor.moveCursor(8, 5);

    // Run SFDX: Toggle Checkpoint.
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Toggle Checkpoint', 1);

    // Calling SFDX: Update Checkpoints in Org fails if the org has been recently created,
    // it does not complete the 6 steps but only 4.
    // Reloading the window forces the extensions to be reloaded and this seems to fix the issue.
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 10);
    await utilities.pause(20);

    // Verify checkpoint is present
    const breakpoints = await $$('.codicon-debug-breakpoint-conditional');
    expect(breakpoints.length).toEqual(1);

    // Run SFDX: Update Checkpoints in Org.
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Update Checkpoints in Org', 10);
    // Verify checkpoints updating results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Apex Replay Debugger', 'Starting SFDX: Update Checkpoints in Org', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('SFDX: Update Checkpoints in Org, Step 6 of 6: Confirming successful checkpoint creation');
    expect(outputPanelText).toContain('Ending SFDX: Update Checkpoints in Org');
  });

  step('SFDX: Turn On Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn On Apex Debug Log for Replay Debugger
    const workbench = await utilities.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Turn On Apex Debug Log for Replay Debugger', 10);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Turn On Apex Debug Log for Replay Debugger', fiveMinutes);

    // Look for the success notification that appears which says, "SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran');
    expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'Starting SFDX: Turn On Apex Debug Log for Replay Debugger', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Starting sfdx force:data:record:update --sobjecttype DebugLevel --sobjectid');
    expect(outputPanelText).toContain('SFDX: Turn On Apex Debug Log for Replay Debugger ');
    expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Run Apex Tests', async () => {
    // Run SFDX: Run Apex tests.
    const workbench = await utilities.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Run Apex Tests', 1);

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests', fiveMinutes);
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests: Listening for streaming state changes...', fiveMinutes);
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests: Processing test run', fiveMinutes, false);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Run Apex Tests successfully ran');
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Apex', '=== Test Results', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Assertion Failed: incorrect ticker symbol');
    expect(outputPanelText).toContain('Expected: CRM, Actual: SFDC');
  });

  step('SFDX: Get Apex Debug Logs', async () => {
    // Run SFDX: Get Apex Debug Logs
    const workbench = await utilities.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Get Apex Debug Logs', 1);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Getting Apex debug logs', fiveMinutes);

    // Select a log file
    const quickPicks = await prompt.getQuickPicks();
    expect(quickPicks).not.toBeUndefined();
    expect(quickPicks.length).toBeGreaterThanOrEqual(1);
    await prompt.selectQuickPick('User User - ApexTestHandler');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Get Apex Debug Logs', fiveMinutes);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Get Apex Debug Logs successfully ran');
    expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Apex', 'Starting SFDX: Get Apex Debug Logs', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('|EXECUTION_STARTED');
    expect(outputPanelText).toContain('|EXECUTION_FINISHED');
    expect(outputPanelText).toContain('ended SFDX: Get Apex Debug Logs');

    // Verify content on log file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    const textEditor = await editorView.openEditor(title!) as TextEditor;
    const executionStarted = await textEditor.getLineOfText('|EXECUTION_STARTED');
    const executionFinished = await textEditor.getLineOfText('|EXECUTION_FINISHED');
    expect(executionStarted).toBeGreaterThanOrEqual(1);
    expect(executionFinished).toBeGreaterThanOrEqual(1);
  });

  step('Replay an Apex Debug Log', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    const workbench = await utilities.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Launch Apex Replay Debugger with Current File', 5);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);
  });

  step('Push Fixed Metadata to Scratch Org', async () => {
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = await editorView.openEditor('AccountService.cls') as TextEditor;
    await textEditor.setTextAtLine(6, '\t\t\tTickerSymbol = tickerSymbol');
    await textEditor.save();
    await utilities.pause(2);

    // Push source to org
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Org and Override Conflicts', 1);
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Push Source to Default Org and Override Conflicts', fiveMinutes);
    const successPushNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Push Source to Default Org and Override Conflicts successfully ran');
    expect(successPushNotificationWasFound).toBe(true);
  });

  step('Run Apex Tests to Verify Fix', async () => {
    // Run SFDX: Run Apex tests.
    const workbench = await utilities.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Run Apex Tests', 1);

    // Select the "AccountServiceTest" file
    await prompt.selectQuickPick('AccountServiceTest');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests', fiveMinutes);
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests: Listening for streaming state changes...', fiveMinutes);
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Run Apex Tests: Processing test run', fiveMinutes, false);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Run Apex Tests successfully ran');
    expect(successNotificationWasFound).toBe(true);

    // Verify test results are listed on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Apex', '=== Test Results', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('AccountServiceTest.should_create_account');
    expect(outputPanelText).toContain('Pass');
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
