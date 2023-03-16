/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import path from 'path';
import {
  InputBox,
  QuickOpenBox,
  TextEditor
} from 'wdio-vscode-service';
import {
  ScratchOrg
} from '../scratchOrg';
import * as utilities from '../utilities';

describe('Apex Replay Debugger', async () => {
  let prompt: QuickOpenBox | InputBox;
  let scratchOrg: ScratchOrg;
  const fiveMinutes = 5 * 60;

  step('Set up the testing environment', async () => {
    scratchOrg = new ScratchOrg('ApexReplayDebugger', true); // TODO: Change back to false
    await scratchOrg.setUp();

    // Create Apex class file
    await utilities.createApexClassWithTest('ExampleApexClass');
    await utilities.pause(1);

    // Push source to scratch org
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org and Override Conflicts', 3);

  });

  step('SFDX: Turn On Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn On Apex Debug Log for Replay Debugger
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Turn On Apex Debug Log for Replay Debugger', 1);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Turn On Apex Debug Log for Replay Debugger', fiveMinutes);

    // Look for the success notification that appears which says, "SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Turn On Apex Debug Log for Replay Debugger successfully ran');
    expect(successNotificationWasFound).toBe(true);
  });

  step('Run the Anonymous Apex Debugger with Currently Selected Text', async () => {
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();

    // Open test file
    const textEditor = await editorView.openEditor('ExampleApexClassTest.cls') as TextEditor;

    // Select text
    await textEditor.selectText('ExampleApexClass.SayHello(\'Cody\');');
    await utilities.pause(1);

    // Run SFDX: Launch Apex Replay Debugger with Currently Selected Text.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Execute Anonymous Apex with Currently Selected Text', 1);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running Execute Anonymous Apex', fiveMinutes);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'Execute Anonymous Apex successfully ran');
    expect(successNotificationWasFound).toBe(true);
    await utilities.pause(1);
  });

  step('SFDX: Get Apex Debug Logs', async () => {
    // Run SFDX: Get Apex Debug Logs
    const workbench = await browser.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Get Apex Debug Logs', 1);

    // Select the "ExampleApexClassTest" file
    await prompt.selectQuickPick('ExampleApexClassTest');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Getting Apex debug logs', fiveMinutes);

    // Select a log file
    const quickPicks = await prompt.getQuickPicks();
    expect(quickPicks).not.toBeUndefined();
    expect(quickPicks.length).toBeGreaterThanOrEqual(1);
    await prompt.selectQuickPick('User User - Api');

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Get Apex Debug Logs', fiveMinutes);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Get Apex Debug Logs successfully ran');
    expect(successNotificationWasFound).toBe(true);
  });

  step('SFDX: Launch Apex Replay Debugger with Last Log File', async () => {
    // Run SFDX: Launch Apex Replay Debugger with Last Log File
    const workbench = await browser.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Launch Apex Replay Debugger with Last Log File', 1);

    // Get open text editor
    const editorView = await workbench.getEditorView();

    // Get file path from open text editor
    const activeTab = await editorView.getActiveTab();
    if (!activeTab) {
      expect(activeTab).not.toBeDefined();
    }
    expect(activeTab).not.toBe(undefined);
    const title = await activeTab?.getTitle();
    const logFilePath = path.join(path.delimiter, 'tools', 'debug', 'logs', title!).slice(1); // TODO: Verify that this works on windows
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
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Launch Apex Replay Debugger with Current File', 1);

    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Launch Apex Replay Debugger with Current File successfully ran');

    // Continue with the debug session
    await browser.keys(['F5']);
    await utilities.pause(1);
    await browser.keys(['F5']);
    await utilities.pause(1);

    expect(successNotificationWasFound).toBe(true);
  });

  step('Run the Anonymous Apex Debugger using the Command Palette', async () => {
    const workbench = await browser.getWorkbench();

    // Create anonymous apex file
    await utilities.createAnonymousApexFile();

    // Run SFDX: Launch Apex Replay Debugger with Editor Contents", using the Command Palette.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Execute Anonymous Apex with Editor Contents', 1);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running Execute Anonymous Apex', fiveMinutes);
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'Execute Anonymous Apex successfully ran');
    expect(successNotificationWasFound).toBe(true);
  });

  step('SFDX: Turn Off Apex Debug Log for Replay Debugger', async () => {
    // Run SFDX: Turn Off Apex Debug Log for Replay Debugger
    const workbench = await browser.getWorkbench();
    prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Turn Off Apex Debug Log for Replay Debugger', 1);

    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(workbench, 'Running SFDX: Turn Off Apex Debug Log for Replay Debugger', fiveMinutes);

    // Look for the success notification that appears which says, "SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran".
    const successNotificationWasFound = await utilities.notificationIsPresent(workbench, 'SFDX: Turn Off Apex Debug Log for Replay Debugger successfully ran');
    expect(successNotificationWasFound).toBe(true);
  });

  step('Tear down and clean up the testing environment', async () => {
    await scratchOrg.tearDown();
  });
});
