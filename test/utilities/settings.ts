/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { InputBox, QuickOpenBox } from 'wdio-vscode-service';
import { executeQuickPick } from './commandPrompt.ts';
import { debug, Duration, findElementByText } from './miscellaneous.ts';

async function findAndCheckSetting(
  id: string
): Promise<{ checkButton: WebdriverIO.Element; checkButtonValue: string | null }> {
  debug(`enter findAndCheckSetting for id: ${id}`);
  await browser.keys(id);
  let checkButton: WebdriverIO.Element | null = null;
  let checkButtonValue: string | null = null;

  await browser.waitUntil(
    async () => {
      checkButton = (await findElementByText('div', 'aria-label', id)) as WebdriverIO.Element;
      if (checkButton) {
        checkButtonValue = await checkButton.getAttribute('aria-checked');
        debug(`found setting checkbox with value "${checkButtonValue}"`);
        return true;
      }
      return false;
    },
    {
      timeout: Duration.seconds(5).milliseconds,
      timeoutMsg: `Could not find setting with name: ${id}`
    }
  );

  if (!checkButton) {
    throw new Error(`Could not find setting with name: ${id}`);
  }

  debug(`findAndCheckSetting result for ${id} found ${!!checkButton} value: ${checkButtonValue}`);
  return { checkButton, checkButtonValue };
}

async function openSettings<T>(
  command: string,
  doThis?: (settings: InputBox | QuickOpenBox) => Promise<T | void>,
  timeout: Duration = Duration.seconds(5)
): Promise<T> {
  debug('openSettings - enter');
  const settings = await executeQuickPick(command, Duration.seconds(1));
  debug('openSettings - after open');

  // Clear the input box
  await browser.keys(['Escape', 'Escape']);

  await browser.waitUntil(
    async () => {
      const element = await browser.$(
        '//div[@class="monaco-tl-contents group-title"]//div[text()="Commonly Used"]'
      );
      return element.isDisplayed();
    },
    {
      timeout: Duration.seconds(20).milliseconds,
      timeoutMsg: 'Expected element with text "Commonly Used" to be displayed'
    }
  );

  if (!doThis) {
    return settings as T;
  }
  debug('openSettings - after Commonly Used wait');

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `openSettings doThis function timed out after ${timeout.milliseconds} milliseconds`
        )
      );
    }, timeout.milliseconds);
  });

  const doThisPromise = doThis(settings).then((result) => result ?? settings);

  return (await Promise.race([doThisPromise, timeoutPromise])) as T;
}

export async function inWorkspaceSettings<T>(
  doThis?: (settings: InputBox | QuickOpenBox) => Promise<T | void>,
  timeout: Duration = Duration.seconds(5)
): Promise<T> {
  return openSettings('Preferences: Open Workspace Settings', doThis, timeout);
}

export async function inUserSettings<T>(
  doThis?: (settings: InputBox | QuickOpenBox) => Promise<T | void>,
  timeout: Duration = Duration.seconds(5)
): Promise<T> {
  return openSettings('Preferences: Open User Settings', doThis, timeout);
}

async function toggleBooleanSetting(
  id: string,
  timeout: Duration,
  finalState: boolean | undefined,
  settingsType: 'user' | 'workspace'
): Promise<boolean> {
  const settingsFunction = settingsType === 'workspace' ? inWorkspaceSettings : inUserSettings;
  return await settingsFunction<boolean>(async () => {
    let result = await findAndCheckSetting(id);

    if (finalState !== undefined) {
      if (
        (finalState && result.checkButtonValue === 'true') ||
        (!finalState && result.checkButtonValue === 'false')
      ) {
        return true;
      }
    }
    await result.checkButton.click();
    result = await findAndCheckSetting(id);
    return result.checkButtonValue === 'true';
  }, timeout);
}

export async function enableBooleanSetting(
  id: string,
  timeout: Duration = Duration.seconds(10),
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  debug(`enableBooleanSetting ${id}`);
  return toggleBooleanSetting(id, timeout, true, settingsType);
}

export async function disableBooleanSetting(
  id: string,
  timeout: Duration = Duration.seconds(10),
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  debug(`disableBooleanSetting ${id}`);
  return toggleBooleanSetting(id, timeout, false, settingsType);
}

export async function isBooleanSettingEnabled(
  id: string,
  timeout: Duration = Duration.seconds(5),
  settingsType: 'user' | 'workspace' = 'workspace'
): Promise<boolean> {
  const settingsFunction = settingsType === 'workspace' ? inWorkspaceSettings : inUserSettings;
  return await settingsFunction<boolean>(async () => {
    const { checkButtonValue } = await findAndCheckSetting(id);
    return checkButtonValue === 'true';
  }, timeout);
}
