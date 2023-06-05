/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EnvironmentSettings } from '../environmentSettings';

export async function saveFailedTestScreenshot(specTitle: string, testTitle: string): Promise<void> {
  const saveDir = join(__dirname, '..', '..', 'screenshots', specTitle);
  console.log(`Test run failed! Saving a screenshot of the failure here: ${saveDir}`);
  if (!existsSync(saveDir)) {
    mkdirSync(saveDir, { recursive: true });
  }
  const screenshotPath = getScreenshotTitle(saveDir, testTitle);
  await browser.saveScreenshot(screenshotPath);
}

function getScreenshotTitle(saveDir: string, testTitle: String): string {
  let sanitizedTestTitle = testTitle.replace(/[^a-zA-Z0-9 ]/g, "");
  const testRunStartTime = EnvironmentSettings.getInstance().startTime;
  return join(saveDir, `${testRunStartTime} - ${sanitizedTestTitle}.png`);
}