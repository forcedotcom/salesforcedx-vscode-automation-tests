/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { pause, log } from './miscellaneous';

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
