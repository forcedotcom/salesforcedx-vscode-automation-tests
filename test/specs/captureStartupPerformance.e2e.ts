/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import { readFileSync } from 'fs';

describe('Capture Startup Performance', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('CaptureStartupPerformance - Set up the testing environment');
    testSetup = new TestSetup('CaptureStartupPerformance');
    await testSetup.setUpWithoutScratchOrg();
  });

  xstep('Check for 19 standard object .cls files', async () => {
    // This is a placeholder step. Currently when a Salesforce project is created, you have to reload the window for the 19 sObjects to be present in the .sfdx folder. But reloading the window means the data captured would be a warm start instead of a cold start.
  });

  step('Capture startup peformance data', async () => {
    // 1. Open `Developer: Startup Performance`
    await utilities.openStartupPerformance();
    // 2. Parse the markdown to get the "Extension Activation Stats" using remark-parse
      // a. Save the startup performance file locally (need to use the workaround below because the default directory is NOT always the home directory of the Salesforce project if you hit Ctrl+S on the Startup Performance file)
        // 1. Ctrl+A -> Ctrl+C (copy all the contents of the Startup Performance file)
        // 2. `Output: Focus on Terminal View` in command palette (Terminal should default to the home directory of the Salesforce project)
        // 3. `vi startupPerformance.md` -> `:set paste` -> Ctrl+V -> wait for the file to paste -> `:wq` (what is the alternative for Windows?)
    await utilities.saveStartupPerformance();
      // b. Read the saved startup performance file using fs.readFileSync()
    const startupPerformanceFileContent = readFileSync('startupPerformance.md', 'utf-8');
      // c. Find the "Extension Activation Stats" section
    const extensionActivationStatsContent = await findHeaderInMarkdownFile(startupPerformanceFileContent, 'Extension Activation Stats');
      // d. Parse the table to get the startup performance for each Salesforce extension
    const result = await parseMarkdownTable(extensionActivationStatsContent);
  });

  step('Send startup performance data to AppInsights', async() => {

  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });

  async function findHeaderInMarkdownFile(markdownFileContent: string, header: string): Promise<string> {
    return 'elephant';
  }

  async function parseMarkdownTable(markdownTableContent: string): Promise<string> {
    return 'elephant';
  }
});
