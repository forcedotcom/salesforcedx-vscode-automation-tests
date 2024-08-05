/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { executeQuickPick } from './commandPrompt.ts';
import { Duration, findElementByText } from './miscellaneous.ts';

export async function openOrgBrowser(wait: Duration = Duration.seconds(1)): Promise<void> {
  await executeQuickPick('View: Show Org Browser', wait);
}

export async function verifyOrgBrowerIsOpen(label: string): Promise<void> {
  const orgBrowserLabelEl = await findElementByText(
    'div',
    'aria-label',
    label
  );
  await expect(orgBrowserLabelEl).toBeTruthy();
}

export async function findTypeInOrgBrowser(type: string): Promise<WebdriverIO.Element> {
  return await findElementByText('div', 'aria-label', type);
}
