/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import clipboard from 'clipboardy';
import *  as utilities from './index.ts';
import { TextEditor, Workbench } from 'wdio-vscode-service';


import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;


export async function attemptToFindTextEditorText(filePath: string): Promise<string> {
  await utilities.openFile(filePath);
  await browser.keys([CMD_KEY, 'a', 'c']);
  return await clipboard.read();
}

/**
 * WARN: The func does not work properly on Windows for a large project because of long indexing time! Use openFile instead
 * open a file in the text editor by file name
 * @param workbench page object representing the custom VSCode title bar
 * @param fileName name of the file we want to open and use
 * @returns editor for the given file name
 */
export async function getTextEditor(workbench: Workbench, fileName: string): Promise<TextEditor> {
  const inputBox = await utilities.executeQuickPick('Go to File...', utilities.Duration.seconds(1));
  await inputBox.setText(fileName);
  await inputBox.confirm();
  await utilities.pause(utilities.Duration.seconds(1));
  const editorView = workbench.getEditorView();
  const textEditor = (await editorView.openEditor(fileName)) as TextEditor;
  return textEditor;
}

export async function closeAllEditors() {
  await utilities.executeQuickPick('View: Close All Editors', utilities.Duration.seconds(1));
}

export async function checkFileOpen(
  workbench: Workbench,
  name: string,
  options: { msg?: string; timeout?: utilities.Duration } = { timeout: utilities.Duration.milliseconds(10_000) }
) {
  await browser.waitUntil(
    async () => {
      try {
        const editorView = workbench.getEditorView();
        const activeTab = await editorView.getActiveTab();
        if (activeTab != undefined && name == await activeTab.getTitle()) {
          return true;
        } else return false;
      } catch (error) {
        return false;
      }
    },
    {
      timeout: options.timeout?.milliseconds,
      interval: 500, // Check every 500 ms
      timeoutMsg:
        options.msg ??
        `Expected to find file ${name} open in TextEditor before ${options.timeout}`
    }
  )
}

