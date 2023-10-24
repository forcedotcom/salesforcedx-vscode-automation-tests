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
      log(`extension ${extensionName} was found`);
    }
  }

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
  await runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 50);
}

export async function verifyAllExtensionsAreRunning(): Promise<void> {
  log('');
  log(`Starting verifyAllExtensionsAreRunning()...`);

  // Using the Command palette, run Developer: Show Running Extensions
  const workbench = await (await browser.getWorkbench()).wait();
  await runCommandFromCommandPrompt(workbench, 'Extensions: Enable All Extensions', 5);
  await showRunningExtensions(workbench);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
  await pause(10);

  // Verify CLI Integration extension is present and running
  const coreExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-core'
  );
  expect(coreExtensionWasFound).toBe(true);

  // Verify Apex extension is present and running
  const apexExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-apex'
  );
  expect(apexExtensionWasFound).toBe(true);

  // Verify Apex Replay Debugger extension is present and running
  const ardExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-apex-replay-debugger'
  );
  expect(ardExtensionWasFound).toBe(true);

  // Verify Apex Interactive Debugger extension is present and running
  const isvExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-apex-debugger'
  );
  expect(isvExtensionWasFound).toBe(true);

  // Verify SOQL extension is present and running
  const soqlExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-soql'
  );
  expect(soqlExtensionWasFound).toBe(true);

  // Verify Aura extension is present and running
  const auraExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-lightning'
  );
  expect(auraExtensionWasFound).toBe(true);

  // Verify Visualforce extension is present and running
  const vfExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-visualforce'
  );
  expect(vfExtensionWasFound).toBe(true);

  // Verify LWC extension is present and running
  const lwcExtensionWasFound = await findExtensionInRunningExtensionsList(
    workbench,
    'salesforcedx-vscode-lwc'
  );
  expect(lwcExtensionWasFound).toBe(true);

  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
}
