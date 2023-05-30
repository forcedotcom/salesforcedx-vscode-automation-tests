/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';

describe('Deploy and Retrieve', async () => {
  let testSetup: TestSetup;
  let projectName: string;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('DeployAndRetrieve', false);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();
  });

  step('what?', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });

  step('what?', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
