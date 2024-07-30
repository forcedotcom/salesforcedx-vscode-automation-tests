/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { executeQuickPick } from "./commandPrompt.ts";
import { Duration } from "./miscellaneous.ts";
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

export async function openStartupPerformance(wait = Duration.seconds(1)) {
  await executeQuickPick('Developer: Startup Performance', wait);
}

export async function saveStartupPerformance(wait = Duration.seconds(1)) {
  await browser.keys([CMD_KEY, 'a']);
  await browser.keys([CMD_KEY, 'c']);
  await executeQuickPick('Output: Focus on Terminal View', wait);
  await browser.keys('vi startupPerformance.md');
  await browser.keys(':set paste');
  await browser.keys([CMD_KEY, 'v']);
  await utilities.pause(Duration.minutes(1)); // wait for file to finish pasting
  await browser.keys(':wq');
}
