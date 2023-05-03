/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  InputBox,
  QuickOpenBox,
  Workbench
} from 'wdio-vscode-service';
import {
  log,
  pause
} from './miscellaneous';

export async function openCommandPromptWithCommand(workbench: Workbench, command: string): Promise<InputBox | QuickOpenBox> {
  const prompt = await workbench.openCommandPrompt();
  await pause(5);

  await prompt.setText(`>${command}`);
  await pause(2);

  return prompt;
}

export async function runCommandFromCommandPrompt(workbench: Workbench, command: string, durationInSeconds: number = 0): Promise<InputBox | QuickOpenBox> {
  const prompt = await openCommandPromptWithCommand(workbench, command);
  await selectQuickPickItem(prompt, command);

  if (durationInSeconds > 0) {
    await pause(durationInSeconds);
  }

  return prompt;
}

export async function selectQuickPickWithText(prompt: InputBox | QuickOpenBox, text: string) {
  // Set the text in the command prompt.  Only selectQuickPick() needs to be called, but setting
  // the text in the command prompt is a nice visual feedback to anyone watching the tests run.
  await prompt.setText(text);
  await pause(1);

  await prompt.selectQuickPick(text);
  await pause(1);
  // After the text has been entered and selectQuickPick() is called, you might see the last few characters
  // in the input box be deleted.  This is b/c selectQuickPick() calls resetPosition(), which for some reason
  // deletes the last two characters.  This doesn't seem to affect the outcome though.
}

export async function selectQuickPickItem(prompt: InputBox | QuickOpenBox, text: string): Promise<void> {
  // Type the quick pick item to find into the filter.  Do this incase the
  // pick list item is not visible (and one needs to scroll down to see it).
  // await prompt.setText(text);
  // pause(1);

  const quickPicks = await prompt.getQuickPicks();
  for (const quickPick of quickPicks) {
      const label = await quickPick.getLabel();
      if (label === text) {
          await quickPick.select();
          return;
      }
  }

  log(`Target QuickPick item '${text}' was not found.  Now dumping pick pick items...`);
  for (const quickPick of quickPicks) {
    const label = await quickPick.getLabel();
    log(`QuickPick item: '${label}'`);
  }

  debugger;

  throw new Error(`Quick pick item ${text} was not found`);
}

export async function clickFilePathOkButton(): Promise<void> {
  const okButton = await $('*:not([style*="display: none"]).quick-input-action .monaco-button');
  await okButton.click();
  await pause(1);
}
