import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('an example using existing project', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('usingExistingProject');
    await testSetup.setUp('developer', utilities.repoKeywords.DeployInv);
    await utilities.reloadAndEnableExtensions();
    await expect(1).toBe(false); // make it false to see screenshots
  });

});