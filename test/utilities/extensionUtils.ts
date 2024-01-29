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
  'salesforcedx-vscode-expanded',
  'salesforcedx-vscode-soql',
  'salesforcedx-vscode-core',
  'salesforcedx-vscode-apex',
  'salesforcedx-vscode-apex-debugger',
  'salesforcedx-vscode-apex-replay-debugger',
  'salesforcedx-vscode-lightning',
  'salesforcedx-vscode-lwc',
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

  log('&&& enter findExtensionInRunningExtensionsList()');

  // Close the panel and clear notifications so we can see as many of the running extensions as we can.
  try {
    await runCommandFromCommandPrompt(workbench, 'View: Close Panel', 1);
    await runCommandFromCommandPrompt(workbench, 'Notifications: Clear All Notifications', 1);
  } catch {
    // Close the command prompt by hitting the Escape key
    await browser.keys(['Escape']);
    log('No panel or notifs to close - command not found');
  }
  pause(1);
  log('closed panel and cleared notifications');

  const extensionNameDivs = await $$('div.monaco-list-row');
  log('extensionNameDivs length = ' + extensionNameDivs.length);
  let extensionWasFound = false;
  log('enter for loop');
  for (const extensionNameDiv of extensionNameDivs) {
    const text = await extensionNameDiv.getAttribute('aria-label');
    log(`looking for ${extensionName}`);
    log('text = ' + text);
    if (text.includes(extensionName)) {
      extensionWasFound = true;
      log(`extension ${extensionName} was found`);
    }
  }

  log('&&& exit findExtensionInRunningExtensionsList()');
  return extensionWasFound;
}

export async function reloadAndEnableExtensions(): Promise<void> {
  const buttons = await $$('a.monaco-button.monaco-text-button');
  let extraPause = false;
  for (const item of buttons) {
    const text = await item.getText();
    if (text.includes('Reload and Enable Extensions')) {
      log('reloadAndEnableExtensions() - Reload and Enable Extensions');
      await item.click();
      extraPause = true;
    }
  }
  if (extraPause) {
    log('reloadAndEnableExtensions() - extra pause');
    pause(30);
  }
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
  await runCommandFromCommandPrompt(workbench, 'Extensions: Install from VSIX...', 5);
  await browser.keys([CMD_KEY, 'a']);
  await browser.keys(pathToExtensions);
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
}

export async function verifyAllExtensionsAreRunning(): Promise<void> {
  log('');
  log(`Starting verifyAllExtensionsAreRunning()...`);

  // Using the Command palette, run Developer: Show Running Extensions
  const workbench = await (await browser.getWorkbench()).wait();
  await runCommandFromCommandPrompt(workbench, 'Extensions: Enable All Extensions', 5);
  await showRunningExtensions(workbench);

  // Zoom out so all the extensions are visible
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 1);

  // Goes through each and all of the extensions verifying they're running in no longer than 100 secs
  await findExtensionsWithTimeout();

  // Zoom back in to initial state
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 1);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 1);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 1);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 1);
  log(`... Finished verifyAllExtensionsAreRunning()`);
  log('');
}

export async function findExtensionsWithTimeout(): Promise<void> {
  const workbench = await (await browser.getWorkbench()).wait();
  let forcedWait = 0;
  let extensionWasFound = false;
  for (const extension of extensions.slice(-7)) {
    log(`Verifying extension ${extension}`);
    do {
      await pause(7);
      extensionWasFound = await findExtensionInRunningExtensionsList(workbench, extension);
      forcedWait += 10;
    } while (extensionWasFound === false && forcedWait < 100);
    log(`extension ${extension} was found: ${extensionWasFound}`);
    forcedWait = 0;
    expect(extensionWasFound).toBe(true);
  }
}
