/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

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
    // 2. Parse the markdown to get the "Extension Activation Stats"
  });

  step('Send startup performance data to AppInsights', async() => {

  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
