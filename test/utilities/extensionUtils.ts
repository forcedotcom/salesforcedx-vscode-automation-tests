/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { pause } from './miscellaneous';

export async function showRunningExtensions(workbench: Workbench): Promise<void> {
  await runCommandFromCommandPrompt(workbench, 'Developer: Show Running Extensions', 2);
}

export async function findExtensionInRunningExtensionsList(
  workbench: Workbench,
  extensionName: string
): Promise<boolean> {
  // This function assumes the Extensions list was opened.

  // Close the panel so we can see as many of the running extensions as we can.
  await runCommandFromCommandPrompt(workbench, 'View: Close Panel', 1);

  const extensionNameDivs = await $$('div.name');
  let extensionWasFound = false;
  for (const extensionNameDiv of extensionNameDivs) {
    const text = await extensionNameDiv.getText();
    if (text.includes(extensionName)) {
      extensionWasFound = true;
    }
  }

  return extensionWasFound;
}
