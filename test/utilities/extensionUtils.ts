/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { log, pause } from './miscellaneous';

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
  }
  catch {
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

export async function verifyAllExtensionsAreRunning(): Promise<void> {
  log('');
  log(`Starting verifyAllExtensionsAreRunning()...`);

  // Using the Command palette, run Developer: Show Running Extensions
  const workbench = await (await browser.getWorkbench()).wait();
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

  // // Verify LWC extension is present and running
  // const lwcExtensionWasFound = await findExtensionInRunningExtensionsList(
  //   workbench,
  //   'salesforcedx-vscode-lwc'
  // );
  // expect(lwcExtensionWasFound).toBe(true);

  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
  await runCommandFromCommandPrompt(workbench, 'View: Zoom In', 2);
}
