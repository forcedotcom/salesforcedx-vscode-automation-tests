import { step } from 'mocha-steps';
import { RefactoredTestSetup } from '../RefactoredTestSetup.ts';
import * as utilities from '../utilities/index.ts';


describe('Customize sfdx-project.json', async () => {
  const testSetup = new RefactoredTestSetup();
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'sfdxProjectJson'
  }

  step('Set up the testing environment', async () => {
    await testSetup.setUp(testReqConfig);
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
