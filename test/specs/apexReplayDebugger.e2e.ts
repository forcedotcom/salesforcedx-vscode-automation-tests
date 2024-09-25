/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import path from 'path';
import { InputBox, QuickOpenBox, TextEditor } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('Apex Replay Debugger', async () => {
  let prompt: QuickOpenBox | InputBox;
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'ApexReplayDebugger'
  }
  const CONTINUE = 'F5';

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);

    // Create Apex class file
    await utilities.createApexClassWithTest('ExampleApexClass');

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

  step('SFDX: Turn On Apex Debug Log for Replay Debugger', async () => {
    // Clear output before running the command
    await utilities.clearOutputView();

    // Run SFDX: Turn On Apex Debug Log for Replay Debugger
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

  step('Run the Anonymous Apex Debugger with Currently Selected Text', async () => {
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'ExampleApexClassTest.cls');

    // Select text
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(["ExampleApexClass.SayHello('Cody');"]);
    await utilities.pause(utilities.Duration.seconds(1));

    // Clear output before running the command
    await utilities.clearOutputView();

    // Run SFDX: Launch Apex Replay Debugger with Currently Selected Text.
    await utilities.executeQuickPick(
      'SFDX: Execute Anonymous Apex with Currently Selected Text',
      utilities.Duration.seconds(1)
    );

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'Execute Anonymous Apex successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

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
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('Compiled successfully.');
    await expect(outputPanelText).toContain('Executed successfully.');
    await expect(outputPanelText).toContain('|EXECUTION_STARTED');
    await expect(outputPanelText).toContain('|EXECUTION_FINISHED');
    await expect(outputPanelText).toContain('ended Execute Anonymous Apex');
  });

  step('SFDX: Get Apex Debug Logs', async () => {
    // Run SFDX: Get Apex Debug Logs
    const workbench = await utilities.getWorkbench();
    await utilities.clearOutputView();
    prompt = await utilities.executeQuickPick(
      'SFDX: Get Apex Debug Logs',
      utilities.Duration.seconds(10)
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
    await prompt.selectQuickPick('User User - Api');

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

  step('SFDX: Launch Apex Replay Debugger with Last Log File', async () => {
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const editorView = workbench.getEditorView();

    // Get file path from open text editor
    const activeTab = await editorView.getActiveTab();
    await expect(activeTab).not.toBe(undefined);
    const title = await activeTab?.getTitle();
    const logFilePath = path.join(path.delimiter, 'tools', 'debug', 'logs', title!).slice(1);

    // Run SFDX: Launch Apex Replay Debugger with Last Log File
    prompt = await utilities.executeQuickPick(
      'SFDX: Launch Apex Replay Debugger with Last Log File',
      utilities.Duration.seconds(1)
    );
    await prompt.setText(logFilePath);
    await prompt.confirm();
    await utilities.pause();

    // Continue with the debug session
    await continueDebugging();
  });

  step('SFDX: Launch Apex Replay Debugger with Current File - log file', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    await utilities.executeQuickPick('View: Open Previous Editor');
    await utilities.executeQuickPick(
      'SFDX: Launch Apex Replay Debugger with Current File',
      utilities.Duration.seconds(1)
    );

    // Continue with the debug session
    await continueDebugging();
  });

  step('SFDX: Launch Apex Replay Debugger with Current File - test class', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Current File
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'ExampleApexClassTest.cls');
    await utilities.executeQuickPick(
      'SFDX: Launch Apex Replay Debugger with Current File',
      utilities.Duration.seconds(3)
    );

    // Continue with the debug session
    await continueDebugging();

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'Debug Test(s) successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);
  });

  step('Run the Anonymous Apex Debugger using the Command Palette', async () => {
    // Create anonymous apex file
    await utilities.createAnonymousApexFile();

    // Clear output before running the command
    await utilities.clearOutputView();

    // Run SFDX: Launch Apex Replay Debugger with Editor Contents", using the Command Palette.
    await utilities.executeQuickPick(
      'SFDX: Execute Anonymous Apex with Editor Contents',
      utilities.Duration.seconds(10)
    );

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'Execute Anonymous Apex successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Apex',
      'Starting Execute Anonymous Apex',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('Compiled successfully.');
    await expect(outputPanelText).toContain('Executed successfully.');
    await expect(outputPanelText).toContain('|EXECUTION_STARTED');
    await expect(outputPanelText).toContain('|EXECUTION_FINISHED');
    await expect(outputPanelText).toContain('ended Execute Anonymous Apex');
  });

  step('SFDX: Turn Off Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn Off Apex Debug Log for Replay Debugger
    await utilities.clearOutputView();
    prompt = await utilities.executeQuickPick(
      'SFDX: Turn Off Apex Debug Log for Replay Debugger',
      utilities.Duration.seconds(1)
    );

    // Look for the success notification that appears which says, "SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify content on vscode's Output section
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Turn Off Apex Debug Log for Replay Debugger',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain('Deleting Record...');
    await expect(outputPanelText).toContain('Success');
    await expect(outputPanelText).toContain('Successfully deleted record:');
    await expect(outputPanelText).toContain('ended with exit code 0');
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });

  const continueDebugging = async (): Promise<void> => {
    await browser.keys(CONTINUE);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(CONTINUE);
    await utilities.pause(utilities.Duration.seconds(1));
  };
});
