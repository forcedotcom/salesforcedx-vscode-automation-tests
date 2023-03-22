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
  ScratchOrg
} from '../scratchOrg';
import * as utilities from '../utilities';

/**
 * This test suite walks through the same steps performed in the "Find and Fix Bugs with Apex Replay Debugger" Trailhead Module;
 * which can be found with the following link:
 * https://trailhead.salesforce.com/content/learn/projects/find-and-fix-bugs-with-apex-replay-debugger
 */
describe('"Find and Fix Bugs with Apex Replay Debugger" Trailhead Module', async () => {
  let prompt: QuickOpenBox | InputBox;
  let scratchOrg: ScratchOrg;
  const fiveMinutes = 5 * 60;

  step('Set up the testing environment', async () => {
    scratchOrg = new ScratchOrg('TrailApexReplayDebugger', false);
    await scratchOrg.setUp();

    // Create Apex class AccountService
    await utilities.createApexClassWithBugs();

    // Push source to scratch org
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org and Override Conflicts', 5);
  });

  step('Run Apex Tests', async () => {
    // Run SFDX: Run Apex tests.
    const workbench = await browser.getWorkbench();
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
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = await editorView.openEditor('AccountService.cls') as TextEditor;
    await textEditor.moveCursor(8, 5);

    // Run SFDX: Toggle Checkpoint.
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Toggle Checkpoint', 1);

    // Run SFDX: Update Checkpoints in Org.
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Update Checkpoints in Org', 1);

    // // Verify checkpoints updating results are listed on vscode's Output section
    // const outputPanelText = await utilities.attemptToFindOutputPanelText('Apex Replay Debugger', 'Starting SFDX: Update Checkpoints in Org', 10);
    // expect(outputPanelText).not.toBeUndefined();
    // expect(outputPanelText).toContain('SFDX: Update Checkpoints in Org, Step 6 of 6: Confirming successful checkpoint creation');
    // expect(outputPanelText).toContain('Ending SFDX: Update Checkpoints in Org');
  });

  step('SFDX: Turn On Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn On Apex Debug Log for Replay Debugger
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Turn On Apex Debug Log for Replay Debugger', 10);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Turn On Apex Debug Log for Replay Debugger', fiveMinutes);

    // Look for the success notification that appears which says, "SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran');
    expect(successNotificationWasFound).toBe(true);
  });

  step('Run Apex Tests', async () => {
    // Run SFDX: Run Apex tests.
    const workbench = await browser.getWorkbench();
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
    const workbench = await browser.getWorkbench();
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
  });

  step('Replay an Apex Debug Log', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Launch Apex Replay Debugger with Current File', 1);
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Launch Apex Replay Debugger with Current File successfully ran');
    if (successNotificationWasFound !== true) {
      const failureNotificationWasFound = await utilities.notificationIsPresent(workbench, 'You can only run this command with Anonymous Apex files, Apex Test files, or Apex Debug Log files.');
      if (failureNotificationWasFound === true) {
        expect(successNotificationWasFound).toBe(false);
      } else {
        utilities.log('Warning - Launching Apex Replay Debugger with Current File failed, neither the success notification or the failure notification was found.');
      }
    } else {
      expect(successNotificationWasFound).toBe(true);
    }
    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);
  });

  step('Push Fixed Metadata to Scratch Org', async () => {
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = await editorView.openEditor('AccountService.cls') as TextEditor;
    await textEditor.setTextAtLine(6, '\t\t\tTickerSymbol = tickerSymbol');
    await textEditor.save();
    await utilities.pause(1);

    // Push source to scratch org
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org and Override Conflicts', 6);
  });

  step('Run Apex Tests to Verify Fix', async () => {
    // Run SFDX: Run Apex tests.
    const workbench = await browser.getWorkbench();
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
    await scratchOrg.tearDown();
  });
});
