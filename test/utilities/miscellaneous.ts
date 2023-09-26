/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import os from 'os';
import { sleep } from 'wdio-vscode-service';
import { EnvironmentSettings } from '../environmentSettings';

export const FIVE_MINUTES = 5 * 60;

export async function pause(durationInSeconds: number): Promise<void> {
  await sleep(durationInSeconds * EnvironmentSettings.getInstance().throttleFactor * 1000);
}

export function log(message: string) {
  console.log(message);
}

export function currentOsUserName(): string {
  const userName =
    os.userInfo().username ||
    process.env.SUDO_USER ||
    process.env.C9_USER ||
    process.env.LOGNAME ||
    process.env.USER ||
    process.env.LNAME ||
    process.env.USERNAME;

  return userName!;
}

// There is an issue with InputBox.setText().  When a
// period is present, the string passed to the input box
// becomes truncated.  An fix for this is to replace
// the periods with an underscore.
export function transformedUserName(): string {
  return currentOsUserName().replace('.', '_');
}

export async function findLabel(labelText: string): Promise<WebdriverIO.Element> {
  let labels = await $$('span.monaco-highlighted-label');
  let labelElement: WebdriverIO.Element;
  for (const label of labels) {
    labelElement = label;
    const text = await label.getText();

    log(`${labelText} found`);
    if (text === labelText) {
      break;
    }
  }
  return labelElement!;
}
