/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { InputBox, QuickOpenBox, Workbench } from 'wdio-vscode-service';
import { debug, Duration, log, pause } from './miscellaneous.ts';
import { getWorkbench } from './workbench.ts';

export async function openCommandPromptWithCommand(
  workbench: Workbench,
  command: string
): Promise<InputBox | QuickOpenBox> {
  const prompt = await (await workbench.openCommandPrompt()).wait();

  await (await prompt.wait()).setText(`>${command}`);

  return prompt;
}

export async function runCommandFromCommandPrompt(
  workbench: Workbench,
  command: string,
  durationInSeconds: Duration = Duration.seconds(0)
): Promise<InputBox | QuickOpenBox> {
  const prompt = await (await openCommandPromptWithCommand(workbench, command)).wait();
  await selectQuickPickItem(prompt, command);

  if (durationInSeconds.milliseconds > 0) {
    await pause(durationInSeconds);
  }

  return prompt;
}

export async function selectQuickPickWithText(prompt: InputBox | QuickOpenBox, text: string) {
  // Set the text in the command prompt.  Only selectQuickPick() needs to be called, but setting
  // the text in the command prompt is a nice visual feedback to anyone watching the tests run.
  await prompt.setText(text);
  await pause(Duration.seconds(1));

  await prompt.selectQuickPick(text);
  await pause(Duration.seconds(1));
  // After the text has been entered and selectQuickPick() is called, you might see the last few characters
  // in the input box be deleted.  This is b/c selectQuickPick() calls resetPosition(), which for some reason
  // deletes the last two characters.  This doesn't seem to affect the outcome though.
}

export async function selectQuickPickItem(
  prompt: InputBox | QuickOpenBox | undefined,
  text: string
): Promise<void> {
  if (!prompt) {
    throw new Error('Prompt canot be undefined');
  }
  const quickPick = await prompt.findQuickPick(text);
  if (!quickPick || (await quickPick.getLabel()) !== text) {
    throw new Error(`Quick pick item ${text} was not found`);
  }
  await quickPick.select();
  await pause(Duration.seconds(1));
}

export async function findQuickPickItem(
  inputBox: InputBox | QuickOpenBox | undefined,
  quickPickItemTitle: string,
  useExactMatch: boolean,
  selectTheQuickPickItem: boolean
): Promise<boolean> {
  if (!inputBox) {
    return false;
  }
  // Type the text into the filter.  Do this in case the pick list is long and
  // the target item is not visible (and one needs to scroll down to see it).
  await inputBox.setText(quickPickItemTitle);
  await pause(Duration.seconds(1));

  let itemWasFound = false;
  const quickPicks = await inputBox.getQuickPicks();
  for (const quickPick of quickPicks) {
    const label = await quickPick.getLabel();
    if (useExactMatch && label === quickPickItemTitle) {
      itemWasFound = true;
    } else if (!useExactMatch && label.includes(quickPickItemTitle)) {
      itemWasFound = true;
    }

    if (itemWasFound) {
      if (selectTheQuickPickItem) {
        await quickPick.select();
        await pause(Duration.seconds(1));
      }

      return true;
    }
  }

  return false;
}

export async function waitForQuickPick(
  prompt: InputBox | QuickOpenBox | undefined,
  pickListItem: string,
  options: { msg?: string; timeout?: Duration } = { timeout: Duration.milliseconds(10_000) }
) {
  await browser.waitUntil(
    async () => {
      try {
        await findQuickPickItem(prompt, pickListItem, false, true);
        return true;
      } catch (error) {
        return false;
      }
    },
    {
      timeout: options.timeout?.milliseconds,
      interval: 500, // Check every 500 ms
      timeoutMsg: options.msg ?? `Expected to find option ${pickListItem} before ${options.timeout}`
    }
  );
}
/**
 * Runs exact command from command palette
 * @param command
 * @param wait - default is  1 second
 * @returns
 */
export async function executeQuickPick(
  command: string,
  wait: Duration = Duration.seconds(1)
): Promise<InputBox | QuickOpenBox> {
  debug(`executeQuickPick command: ${command}`);
  try {
    const workbench = await getWorkbench();
    const prompt = await workbench.executeQuickPick(command);
    await pause(wait);
    return prompt;
  } catch (error) {
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      throw new Error(`Unknown error: ${error}`);
    }

    if (errorMessage.includes('Command not found')) {
      throw new Error(`Command not found: ${command}`);
    } else {
      throw error;
    }
  }
}

export async function clickFilePathOkButton(): Promise<void> {
  const okButton = await $('*:not([style*="display: none"]).quick-input-action .monaco-button');

  if (!okButton) {
    throw new Error('Ok button not found');
  }

  await browser.keys(['Tab']);
  await pause(Duration.milliseconds(500));
  await browser.keys(['Enter']);

  await pause(Duration.seconds(1));
  const buttons = await $$('a.monaco-button.monaco-text-button');
  for (const item of buttons) {
    const text = await item.getText();
    if (text.includes('Overwrite')) {
      log('clickFilePathOkButton() - folder already exists');
      await item.waitForClickable({
        timeout: Duration.seconds(5).milliseconds,
        interval: Duration.milliseconds(500).milliseconds,
        timeoutMsg: `Overwrite button not clickable within 5 seconds`
      });
      await item.click();
    }
  }
  await pause(Duration.seconds(2));
}

export async function setDefaultOrg(targetOrg: string): Promise<void> {
  const inputBox = await executeQuickPick('SFDX: Set a Default Org');
  await findQuickPickItem(inputBox, targetOrg, false, true);
}
