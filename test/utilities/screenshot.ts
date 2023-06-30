/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EnvironmentSettings } from '../environmentSettings';

export async function saveFailedTestScreenshot(specTitle: string, testTitle: string, isError = true): Promise<void> {
  const saveDir = join(__dirname, '..', '..', 'screenshots', sanitizePath(specTitle));
  if (isError) {
    console.log(`Test run failed! Saving a screenshot of the failure here: ${saveDir}`);
  }

  if (!existsSync(saveDir)) {
    mkdirSync(saveDir, { recursive: true });
  }
  const screenshotPath = getScreenshotSavePath(saveDir, testTitle);
  if (!isError) {
    console.log(`Debugging... saving screenshot to: ${screenshotPath}`);
  }
  await browser.saveScreenshot(screenshotPath);
}

function getScreenshotSavePath(saveDir: string, testTitle: string): string {
  const sanitizedTestTitle = sanitizePath(testTitle);
  const sanitizedTestRunStartTime = EnvironmentSettings.getInstance().startTime.replace(':', '.');
  return join(saveDir, `${sanitizedTestRunStartTime} - ${sanitizedTestTitle}.png`);
}

function sanitizePath(dir: string): string {
  //GHA does not allow for file uploads with: ", :, <, >, |, *, ?, \r, \n
  return dir.replace(/[^a-zA-Z0-9 ]/g, "");
}