/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { FIVE_MINUTES, log, pause } from './miscellaneous';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';
import path from 'path';

const extensions: string[] = [
  'salesforcedx-vscode',
  'salesforcedx-vscode-apex',
  'salesforcedx-vscode-apex-debugger',
  'salesforcedx-vscode-apex-replay-debugger-',
  'salesforcedx-vscode-core',
  'salesforcedx-vscode-expanded',
  'salesforcedx-vscode-lightning',
  'salesforcedx-vscode-lwc',
  'salesforcedx-vscode-soql',
  'salesforcedx-vscode-visualforce'
];

export async function showRunningExtensions(workbench: Workbench): Promise<void> {
  await runCommandFromCommandPrompt(workbench, 'Developer: Show Running Extensions', 5);
}

export async function findExtensionInRunningExtensionsList(
  workbench: Workbench,
  extensionName: string
): Promise<boolean> {
  // This function assumes the Extensions list was opened.

  // Close the panel and clear notifications so we can see as many of the running extensions as we can.
  try {
    await runCommandFromCommandPrompt(workbench, 'View: Close Panel', 1);
  } catch {
    // Close the command prompt by hitting the Escape key
    await browser.keys(['Escape']);
    log('No panel to close - command not found');
  }
  pause(1);
  await runCommandFromCommandPrompt(workbench, 'Notifications: Clear All Notifications', 1);

  const extensionNameDivs = await $$('div.monaco-list-row');
  let extensionWasFound = false;
  for (const extensionNameDiv of extensionNameDivs) {
    const text = await extensionNameDiv.getAttribute('aria-label');
    if (text.includes(extensionName)) {
      extensionWasFound = true;
    }
  }

  return extensionWasFound;
}

export async function reloadAndEnableExtensions(): Promise<void> {
  const workbench = await (await browser.getWorkbench()).wait();
  const buttons = await $$('a.monaco-button.monaco-text-button');
  for (const item of buttons) {
    const text = await item.getText();
    if (text.includes('Reload and Enable Extensions')) {
      log('reloadAndEnableExtensions() - Reload and Enable Extensions');
      await item.click();
    }
  }
  pause(30);
}

export async function installExtension(extension: string): Promise<void> {
  const pathToExtensions = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'salesforcedx-vscode',
    'extensions',
    extension
  );
  log(`SetUp - Started Install extension ${extension}`);
  const workbench = await (await browser.getWorkbench()).wait();
  await runCommandFromCommandPrompt(workbench, 'Extensions: Install from VSIX...', 10);
  await browser.keys([CMD_KEY, 'a']);
  await browser.keys(pathToExtensions);
  await pause(2);
  await browser.keys(['Enter']);
  log(`...SetUp - Finished Install extension ${extension}`);
}

export async function installExtensions(): Promise<void> {
  const workbench = await (await browser.getWorkbench()).wait();
  for (const extension of extensions) {
    await installExtension(extension);
  }
  await pause(FIVE_MINUTES);
  await runCommandFromCommandPrompt(workbench, 'Extensions: Enable All Extensions', 5);
  await runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 10);
  await runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 100);
}
