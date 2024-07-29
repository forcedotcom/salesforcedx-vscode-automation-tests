/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('Use existing project', async () => {
  let testSetup: TestSetup;
  step('verify existing project is open', async () => {
    testSetup = new TestSetup('UseExisProject');
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify existing project open`);
    await testSetup.setUpTestingEnvironment();
    await testSetup.verifyProjectCreated('dreamhouse-lwc-testing');
  });
});
