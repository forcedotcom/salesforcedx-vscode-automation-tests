/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('Org Browser', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('OrgBrowser', false);
    await testSetup.setUp();
  });

  step('Check Org Browser is connected to target org', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Check Org Browser is connected to target org`
    );
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Show Org Browser', 5);

    const orgBrowserLabel = await utilities.findLabel(testSetup.scratchOrgAliasName!);
    utilities.log(`${testSetup.testSuiteSuffixName} - Org Browser is connected to target org`);
    expect(orgBrowserLabel).toBe(testSetup.scratchOrgAliasName);
  });

  step('Retrieve Apex Classes', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Retrieve Apex Classes`);
    // Check there are no classes displayed
    const apexClassesLabel = await utilities.findLabel('Apex Classes');
    apexClassesLabel.click();
    utilities.pause(5);

    const noCompsAvailableLabel = await utilities.findLabel('No components available');

    expect(noCompsAvailableLabel).toBe('No components available');
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
