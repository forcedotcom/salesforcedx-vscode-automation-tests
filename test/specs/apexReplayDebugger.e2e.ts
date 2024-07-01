/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import path from 'path';
import { InputBox, QuickOpenBox, TextEditor } from 'wdio-vscode-service';
// import { CMD_KEY } from 'wdio-vscode-service/dist/constants.ts';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
import { Duration } from '@salesforce/kit';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('Apex Replay Debugger', async () => {
  let prompt: QuickOpenBox | InputBox;
  let testSetup: TestSetup;
  const CONTINUE = 'F5';

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('ApexReplayDebugger', false);
    await testSetup.setUp();

    // Create Apex class file
    await utilities.createApexClassWithTest('ExampleApexClass');

    // Push source to org
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Ignore Conflicts',
      Duration.seconds(1)
    );

    const successPushNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org and Ignore Conflicts successfully ran',
      utilities.TEN_MINUTES
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
    // Clear output before running the command
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', Duration.seconds(1));

    // Run SFDX: Turn On Apex Debug Log for Replay Debugger
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Turn On Apex Debug Log for Replay Debugger',
      Duration.seconds(10)
    );

    // Look for the success notification that appears which says, "SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran',
      utilities.TEN_MINUTES
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
    await utilities.getTextEditor(workbench, 'ExampleApexClassTest.cls');

    // Select text
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(["ExampleApexClass.SayHello('Cody');"]);
    await utilities.pause(Duration.seconds(1));

    // Clear output before running the command
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', Duration.seconds(1));

    // Run SFDX: Launch Apex Replay Debugger with Currently Selected Text.
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Execute Anonymous Apex with Currently Selected Text',
      Duration.seconds(1)
    );

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Execute Anonymous Apex successfully ran',
      utilities.TEN_MINUTES
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
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', Duration.seconds(1));
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Get Apex Debug Logs', Duration.seconds(1));

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Getting Apex debug logs',
      utilities.TEN_MINUTES
    );

    // Select a log file
    const quickPicks = await prompt.getQuickPicks();
    expect(quickPicks).not.toBeUndefined();
    expect(quickPicks.length).toBeGreaterThanOrEqual(1);
    await prompt.selectQuickPick('User User - Api');

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Get Apex Debug Logs successfully ran',
      utilities.TEN_MINUTES
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
    const editorView = workbench.getEditorView();

    // Get file path from open text editor
    const activeTab = await editorView.getActiveTab();
    expect(activeTab).not.toBe(undefined);
    const title = await activeTab?.getTitle();
    const logFilePath = path.join(path.delimiter, 'tools', 'debug', 'logs', title!).slice(1);

    // Run SFDX: Launch Apex Replay Debugger with Last Log File
    prompt = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Launch Apex Replay Debugger with Last Log File',
      Duration.seconds(1)
    );
    await prompt.setText(logFilePath);
    await prompt.confirm();
    await utilities.pause(Duration.seconds(1));

    // Continue with the debug session
    await continueDebugging();
  });

  step('SFDX: Launch Apex Replay Debugger with Current File - log file', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Open Previous Editor');
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Launch Apex Replay Debugger with Current File',
      Duration.seconds(1)
    );

    // Continue with the debug session
    await continueDebugging();
  });

  step('SFDX: Launch Apex Replay Debugger with Current File - test class', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.getTextEditor(workbench, 'ExampleApexClassTest.cls');
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Launch Apex Replay Debugger with Current File',
      Duration.seconds(3)
    );

    // Continue with the debug session
    await continueDebugging();

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Debug Test(s) successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);
  });

  step('Run the Anonymous Apex Debugger using the Command Palette', async () => {
    const workbench = await (await browser.getWorkbench()).wait();

    // Create anonymous apex file
    await utilities.createAnonymousApexFile();

    // Clear output before running the command
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', Duration.seconds(1));

    // Run SFDX: Launch Apex Replay Debugger with Editor Contents", using the Command Palette.
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Execute Anonymous Apex with Editor Contents',
      Duration.seconds(10)
    );

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Execute Anonymous Apex successfully ran',
      utilities.TEN_MINUTES
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
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', Duration.seconds(1));
    prompt = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Turn Off Apex Debug Log for Replay Debugger',
      Duration.seconds(1)
    );

    // Look for the success notification that appears which says, "SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran',
      utilities.TEN_MINUTES
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

  const continueDebugging = async (): Promise<void> => {
    await browser.keys(CONTINUE);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(CONTINUE);
    await utilities.pause(Duration.seconds(1));
  };
});
