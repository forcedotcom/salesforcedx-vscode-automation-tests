/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import os from 'os';
import { TextEditor, Workbench, sleep } from 'wdio-vscode-service';
import { EnvironmentSettings } from '../environmentSettings';
import { attemptToFindOutputPanelText } from './outputView';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { notificationIsPresentWithTimeout } from './notifications';
import path from 'path';
import { getWorkbench } from './workbench';

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

/**
 * @param type type of html tag we want to find
 * @param attribute attribute that holds the given text
 * @param labelText text of the element we want to find
 * @returns element that contains the given text
 */
export async function findElementByText(
  type: string,
  attribute: string,
  labelText: string
): Promise<WebdriverIO.Element> {
  const element = await $(`${type}[${attribute}="${labelText}"]`);
  return element!;
}

/**
 * @param workbench page object representing the custom VSCode title bar
 * @param fileName name of the file we want to open and use
 * @returns editor for the given file name
 */
export async function getTextEditor(workbench: Workbench, fileName: string): Promise<TextEditor> {
  const inputBox = await runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
  await inputBox.setText(fileName);
  await inputBox.confirm();
  await pause(1);
  const editorView = workbench.getEditorView();
  const textEditor = (await editorView.openEditor(fileName)) as TextEditor;
  return textEditor;
}

export async function createCommand(
  type: string,
  name: string,
  folder: string,
  extension: string
): Promise<string | undefined> {
  const workbench = await getWorkbench();
  await runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
  const inputBox = await runCommandFromCommandPrompt(workbench, `SFDX: Create ${type}`, 1);

  // Set the name of the new component to name.
  await inputBox.setText(name);
  await inputBox.confirm();
  await pause(1);

  // Select the default directory (press Enter/Return).
  await inputBox.confirm();

  const successNotificationWasFound = await notificationIsPresentWithTimeout(
    workbench,
    `SFDX: Create ${type} successfully ran`,
    TEN_MINUTES
  );
  expect(successNotificationWasFound).toBe(true);

  const outputPanelText = await attemptToFindOutputPanelText(
    `Salesforce CLI`,
    `Finished SFDX: Create ${type}`,
    10
  );
  expect(outputPanelText).not.toBeUndefined();
  const typePath = path.join(`force-app`, `main`, `default`, folder, `${name}.${extension}`);
  expect(outputPanelText).toContain(`create ${typePath}`);

  const metadataPath = path.join(
    `force-app`,
    `main`,
    `default`,
    folder,
    `${name}.${extension}-meta.xml`
  );
  expect(outputPanelText).toContain(`create ${metadataPath}`);
  return outputPanelText;
}
