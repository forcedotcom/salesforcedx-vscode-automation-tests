/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Duration } from '@salesforce/kit';
import { InputBox, QuickOpenBox } from 'wdio-vscode-service';
import * as changeCase from 'change-case';
import { executeQuickPick } from './commandPrompt.ts';
import { debug, findElementByText } from './miscellaneous.ts';
import { Key } from 'webdriverio';

const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

async function findAndCheckSetting(
  id: string
): Promise<{ checkButton: WebdriverIO.Element; checkButtonValue: string | null }> {
  const search = changeCase.capitalCase(id);
  await browser.keys(search);
  let checkButton: WebdriverIO.Element | null = null;
  let checkButtonValue: string | null = null;

  await browser.waitUntil(
    async () => {
      checkButton = (await findElementByText('div', 'aria-label', id)) as WebdriverIO.Element;
      if (checkButton) {
        checkButtonValue = await checkButton.getAttribute('aria-checked');
        return true;
      }
      return false;
    },
    {
      timeout: Duration.seconds(5).milliseconds,
      timeoutMsg: `Could not find setting with name: ${name}`
    }
  );

  if (!checkButton) {
    throw new Error(`Could not find setting with name: ${name}`);
  }

  debug(`findAndCheckSetting result for ${id} found ${!!checkButton} value: ${checkButtonValue}`);
  return { checkButton, checkButtonValue };
}

/**
 * Run the optional function with the workspace settings editor context
 * @param doThis function to run
 * @param timeout max time spent waiting for doThis function to complete
 * @returns
 */
export async function inWorkspaceSettings<T>(
  doThis?: (settings: InputBox | QuickOpenBox) => Promise<T | void>,
  timeout: Duration = Duration.seconds(5) // Default timeout to 5 seconds
): Promise<T> {
  try {
    debug('inWorkspaceSettings - enter');
    const settings = await executeQuickPick(
      'Preferences: Open Workspace Settings',
      Duration.seconds(1)
    );
    debug('inWorkspaceSettings - after open');
    // Wait for the specified XPath after the action is complete
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

    // If doThis is undefined, return settings
    if (!doThis) {
      return settings as T;
    }
    debug('inWorkspaceSettings - after Commonly Used wait');
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `inWorkspaceSettings doThis function timed out after ${timeout.milliseconds} milliseconds`
          )
        );
      }, timeout.milliseconds);
    });

    // Call the provided function with the settings editor
    const doThisPromise = doThis(settings).then((result) => result ?? settings);

    // Race between the doThis promise and the timeout promise
    return (await Promise.race([doThisPromise, timeoutPromise])) as T;
  } finally {
    await browser.keys([CMD_KEY, 'w']);
  }
}

/**
 * Toggles the boolean setting via Workspace Settings Editor
 * @param id fully qualified setting name, i.e. 'salesforcedx-vscode-core.experimental.enableSourceTrackingForDeployAndRetrieve'
 * @param timeout
 * @param finalState
 * @returns
 */
export async function toggleBooleanSetting(
  id: string,
  timeout: Duration = Duration.seconds(5),
  finalState?: boolean
): Promise<boolean> {
  return await inWorkspaceSettings<boolean>(async () => {
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

/**
 * Enables a boolean setting via Workspace Settings Editor
 * @param id fully qualified setting name, i.e. 'salesforcedx-vscode-core.experimental.enableSourceTrackingForDeployAndRetrieve'
 * @param timeout
 * @returns
 */
export async function enableBooleanSetting(
  id: string,
  timeout = Duration.seconds(10)
): Promise<boolean> {
  return toggleBooleanSetting(id, timeout, true);
}

/**
 * Disables a boolean setting via Workspace Settings Editor
 * @param id fully qualified setting name, i.e. 'salesforcedx-vscode-core.experimental.enableSourceTrackingForDeployAndRetrieve'
 * @param timeout
 * @returns
 */
export async function disableBooleanSetting(
  id: string,
  timeout = Duration.seconds(10)
): Promise<boolean> {
  return toggleBooleanSetting(id, timeout, false);
}

export async function isBooleanSettingEnabled(
  id: string,
  timeout: Duration = Duration.seconds(5)
): Promise<boolean> {
  return await inWorkspaceSettings<boolean>(async () => {
    const { checkButtonValue } = await findAndCheckSetting(id);
    return checkButtonValue === 'true';
  }, timeout);
}
