/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('SFDX: Create Project', async () => {
  let testSetup: TestSetup;

  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NONE,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'sfdxCreateProject'
  }

  step('Set up testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
  });

  step('Execute command SFDX: Create Project', async () => {
    utilities.log(`Starting command SFDX: Create Project...`);
    const prompt = await utilities.executeQuickPick('SFDX: Create Project');
    await utilities.waitForQuickPick(prompt, 'Standard', {
      msg: 'Expected extension salesforcedx-core to be available within 5 seconds',
      timeout: utilities.Duration.seconds(5)
    });

    // Enter the project's name.
    await prompt.setText(testSetup.tempProjectName);
    await utilities.pause(utilities.Duration.seconds(2));

    // Press Enter/Return.
    await prompt.confirm();

    // Set the location of the project.
    const input = await prompt.input$;
    await input.setValue(testSetup.tempFolderPath!);
    await utilities.pause(utilities.Duration.seconds(2));
    await utilities.clickFilePathOkButton();
  });

  step('Verify the project is created and open in the workspace', async () => {
    // Verify the project was created and was loaded.
    await utilities.verifyProjectLoaded(testSetup.tempProjectName);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });

});
