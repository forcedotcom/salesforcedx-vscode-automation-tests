/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import path from 'path';
import { InputBox, QuickOpenBox, TextEditor } from 'wdio-vscode-service';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('Apex Replay Debugger', async () => {
  let prompt: QuickOpenBox | InputBox;
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('ApexReplayDebugger', false);
    await testSetup.setUp();

    // Create Apex class file
    await utilities.createApexClassWithTest('ExampleApexClass');

    // Push source to org
    const workbench = await (await browser.getWorkbench()).wait();
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

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get Apex LSP Status Bar
    const workbench = await (await browser.getWorkbench()).wait();
    const statusBar = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      'Editor Language Status'
    );
    await statusBar.click();
    expect(await statusBar.getAttribute('aria-label')).toContain('Indexing complete');
  });

  step('SFDX: Turn On Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn On Apex Debug Log for Replay Debugger
    const workbench = await (await browser.getWorkbench()).wait();

    // Calling SFDX: Turn On Apex Debug Log for Replay Debugger fails on some machines.
    // Reloading the window forces the extensions to be reloaded and this seems to fix
    // the issue.
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 30);

    // Clear output before running the command
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Turn On Apex Debug Log for Replay Debugger',
      10
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Turn On Apex Debug Log for Replay Debugger',
      utilities.FIVE_MINUTES
    );

    // Look for the success notification that appears which says, "SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Turn On Apex Debug Log for Replay Debugger',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('SFDX: Turn On Apex Debug Log for Replay Debugger ');
    expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Run the Anonymous Apex Debugger with Currently Selected Text', async () => {
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = workbench.getEditorView();

    // Open test file
    const textEditor = (await editorView.openEditor('ExampleApexClassTest.cls')) as TextEditor;

    // Select text
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys(["ExampleApexClass.SayHello('Cody');"]);
    await utilities.pause(1);

    // Clear output before running the command
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);

    // Run SFDX: Launch Apex Replay Debugger with Currently Selected Text.
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Execute Anonymous Apex with Currently Selected Text',
      1
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running Execute Anonymous Apex',
      utilities.FIVE_MINUTES
    );

    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'Execute Anonymous Apex successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Close finder tool
    await browser.keys(['Escape']);
    await browser.keys(['Escape']);
    await browser.keys(['Escape']);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      'Starting Execute Anonymous Apex',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Compiled successfully.');
    expect(outputPanelText).toContain('Executed successfully.');
    expect(outputPanelText).toContain('|EXECUTION_STARTED');
    expect(outputPanelText).toContain('|EXECUTION_FINISHED');
    expect(outputPanelText).toContain('ended Execute Anonymous Apex');
  });

  step('SFDX: Get Apex Debug Logs', async () => {
    // Run SFDX: Get Apex Debug Logs
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Get Apex Debug Logs', 1);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Getting Apex debug logs',
      utilities.FIVE_MINUTES
    );

    // Select a log file
    const quickPicks = await prompt.getQuickPicks();
    expect(quickPicks).not.toBeUndefined();
    expect(quickPicks.length).toBeGreaterThanOrEqual(1);
    await prompt.selectQuickPick('User User - Api');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Get Apex Debug Logs',
      utilities.FIVE_MINUTES
    );

    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Get Apex Debug Logs successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      'Starting SFDX: Get Apex Debug Logs',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('|EXECUTION_STARTED');
    expect(outputPanelText).toContain('|EXECUTION_FINISHED');
    expect(outputPanelText).toContain('ended SFDX: Get Apex Debug Logs');

    // Verify content on log file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    const textEditor = (await editorView.openEditor(title!)) as TextEditor;
    const executionStarted = await textEditor.getLineOfText('|EXECUTION_STARTED');
    const executionFinished = await textEditor.getLineOfText('|EXECUTION_FINISHED');
    expect(executionStarted).toBeGreaterThanOrEqual(1);
    expect(executionFinished).toBeGreaterThanOrEqual(1);
  });

  step('SFDX: Launch Apex Replay Debugger with Last Log File', async () => {
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();

    // Get file path from open text editor
    const activeTab = await editorView.getActiveTab();
    expect(activeTab).not.toBe(undefined);
    const title = await activeTab?.getTitle();
    const logFilePath = path.join(path.delimiter, 'tools', 'debug', 'logs', title!).slice(1);

    // Run SFDX: Launch Apex Replay Debugger with Last Log File
    prompt = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Launch Apex Replay Debugger with Last Log File',
      1
    );
    await prompt.setText(logFilePath);
    await prompt.confirm();
    await utilities.pause(1);

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);
  });

  step('SFDX: Launch Apex Replay Debugger with Current File', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Open Previous Editor');
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Launch Apex Replay Debugger with Current File',
      1
    );

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);
  });

  step('Run the Anonymous Apex Debugger using the Command Palette', async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    // Create anonymous apex file
    await utilities.createAnonymousApexFile();

    // Clear output before running the command
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);

    // Run SFDX: Launch Apex Replay Debugger with Editor Contents", using the Command Palette.
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Execute Anonymous Apex with Editor Contents',
      10
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running Execute Anonymous Apex',
      utilities.FIVE_MINUTES
    );
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'Execute Anonymous Apex successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      'Starting Execute Anonymous Apex',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Compiled successfully.');
    expect(outputPanelText).toContain('Executed successfully.');
    expect(outputPanelText).toContain('|EXECUTION_STARTED');
    expect(outputPanelText).toContain('|EXECUTION_FINISHED');
    expect(outputPanelText).toContain('ended Execute Anonymous Apex');
  });

  step('SFDX: Turn Off Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn Off Apex Debug Log for Replay Debugger
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    prompt = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Turn Off Apex Debug Log for Replay Debugger',
      1
    );

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Turn Off Apex Debug Log for Replay Debugger',
      utilities.FIVE_MINUTES
    );

    // Look for the success notification that appears which says, "SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran'
    );
    expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Turn Off Apex Debug Log for Replay Debugger',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Deleting Record...');
    expect(outputPanelText).toContain('Success');
    expect(outputPanelText).toContain('Successfully deleted record:');
    expect(outputPanelText).toContain('ended with exit code 0');
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
