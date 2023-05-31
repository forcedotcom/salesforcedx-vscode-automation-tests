/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export async function saveFailedTestScreenshot(specTitle: string, testTitle: string, error: Error): Promise<void> {
  const saveDir = join(__dirname, '..', '..', 'screenshots', specTitle, testTitle);
  console.log(`Test run failed! Failure: ${error?.message}`);
  console.log(`Saving a screenshot of the failure here: ${saveDir}`);
  if (!existsSync(saveDir)) {
    mkdirSync(saveDir, { recursive: true });
  }
  const screenshotPath = getScreenshotTitle(saveDir, error);
  await browser.saveScreenshot(screenshotPath);
}

/**
 * Supports multiple runs and indicates when we're receiving the same error message
 * repeatedly in the same test.
 * @param saveDir directory where screenshot will be saved
 * @param error result from the test run; message is an optional param
 * @returns 
 */
function getScreenshotTitle(saveDir: string, error: Error): string {
  const errorTitle = error?.message ? error.message : 'Unknown error';
  let sanitizedTestTitle = errorTitle.replace(/[^a-zA-Z0-9 ]/g, "");
  const savedScreenshots = readdirSync(saveDir);

  const numScreenshotsWithSameError = savedScreenshots?.filter(title => {
    return title.includes(sanitizedTestTitle);
  }).length;
  sanitizedTestTitle = numScreenshotsWithSameError + ' - ' + sanitizedTestTitle;

  return join(saveDir, `${sanitizedTestTitle}.png`);
}