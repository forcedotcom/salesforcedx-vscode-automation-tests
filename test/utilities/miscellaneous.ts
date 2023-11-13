/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import os from 'os';
import { EditorView, TextEditor, Workbench, sleep } from 'wdio-vscode-service';
import { EnvironmentSettings } from '../environmentSettings';
import { attemptToFindOutputPanelText } from './outputView';
import { runCommandFromCommandPrompt } from './commandPrompt';

export const FIVE_MINUTES = 5 * 60;
export const TEN_MINUTES = 10 * 60;

export async function pause(durationInSeconds: number): Promise<void> {
  await sleep(durationInSeconds * EnvironmentSettings.getInstance().throttleFactor * 1000);
}

export function log(message: string) {
  console.log(message);
}

export function currentOsUserName(): string {
  const userName =
    os.userInfo().username ||
    process.env.SUDO_USER ||
    process.env.C9_USER ||
    process.env.LOGNAME ||
    process.env.USER ||
    process.env.LNAME ||
    process.env.USERNAME;

  return userName!;
}

// There is an issue with InputBox.setText().  When a
// period is present, the string passed to the input box
// becomes truncated.  An fix for this is to replace
// the periods with an underscore.
export function transformedUserName(): string {
  return currentOsUserName().replace('.', '_');
}

export async function findLabel(
  elementType: string,
  labelText: string
): Promise<WebdriverIO.Element> {
  let labelElement = await $(`${elementType}[aria-label="${labelText}"]`);
  return labelElement!;
}
/**
 * @param operation identifies if it's a pull or push operation
 * @param changes indicates if changes are expected or not
 * @param type indicates if the metadata is expected to have been created, changed or deleted
 * @returns the output panel text after
 */
export async function verifyPushAndPullOutputText(
  operation: string,
  type?: string
): Promise<string | undefined> {
  // Check the output.
  const outputPanelText = await attemptToFindOutputPanelText(
    `Salesforce CLI`,
    `=== ${operation}ed Source`,
    10
  );
  expect(outputPanelText).not.toBeUndefined();
  // expect(outputPanelText).toContain('ended with exit code 0');
  if (type) {
    if (operation === 'Push') {
      expect(outputPanelText).toContain(`${type}  ExampleApexClass1  ApexClass`);
    } else {
      expect(outputPanelText).toContain(`${type}  Admin`);
      expect(outputPanelText).toContain('ended with exit code 0');
    }
  } else {
    expect(outputPanelText).toContain('No results found');
  }

  return outputPanelText;
}

export async function getTextEditor(workbench: Workbench, fileName: string): Promise<TextEditor> {
  const inputBox = await runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
  await inputBox.setText(fileName);
  await inputBox.confirm();
  await pause(1);
  const editorView = await workbench.getEditorView();
  const textEditor = (await editorView.openEditor(fileName)) as TextEditor;
  return textEditor;
}
