import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('Customize sfdx-project.json', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('sfdxProjectJson', false);
    await testSetup.setUp();
    await utilities.createSfdxProjectJsonWithAllFields();
    await utilities.reloadAndEnableExtensions();
  });

  step('Verify our extensions are loaded after updating sfdx-project.json', async () => {
    await expect(
      await utilities.verifyExtensionsAreRunning(utilities.getExtensionsToVerifyActive())
    ).toBe(true);
  });
});
