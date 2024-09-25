/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('Customize sfdx-project.json', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'sfdxProjectJson'
  }

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
    await utilities.createSfdxProjectJsonWithAllFields();
    await utilities.reloadAndEnableExtensions();
  });

  step('Verify our extensions are loaded after updating sfdx-project.json', async () => {
    await expect(
      await utilities.verifyExtensionsAreRunning(utilities.getExtensionsToVerifyActive())
    ).toBe(true);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
