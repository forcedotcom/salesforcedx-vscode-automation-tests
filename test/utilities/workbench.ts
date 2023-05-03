/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  Workbench
} from 'wdio-vscode-service';
import {
  pause
} from './miscellaneous';

export async function getWorkbench(): Promise<Workbench> {
  // const workbench = await (await browser.getWorkbench()).wait();
  await pause(1);
  const workbench = await browser.getWorkbench();
  const theWaitingIsTheHardestPart = await workbench.wait();

  return theWaitingIsTheHardestPart;
}
