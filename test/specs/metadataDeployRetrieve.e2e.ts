/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import path from 'path';

// In future we will merge the test together with deployAndRetrieve
describe('metadata deploy and retrieve', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NAMED,
      githubRepoUrl: 'https://github.com/mingxuanzhangsfdx/DeployInv.git'
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'mdDeployRetrieve'
  }
  let mdPath: string;
  let textV1: string;
  let textV2: string;
  let textV2AfterRetrieve: string;

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
    mdPath = path.join(testSetup.projectFolderPath!, 'force-app/main/default/objects/Account/fields/Deploy_Test__c.field-meta.xml')
  });

  step('Open and deploy MD v1', async () => {
    textV1 = await utilities.attemptToFindTextEditorText(mdPath);
    await runAndValidateCommand('Deploy', 'to', 'ST');
    await utilities.clearOutputView();
    await utilities.closeAllEditors(); // close editor to make sure editor is up to date
  });

  step('Update MD v2 and deploy again', async () => {
    await utilities.gitCheckout('updated-md', testSetup.projectFolderPath);
    textV2 = await utilities.attemptToFindTextEditorText(mdPath);
    await expect(textV1).not.toEqual(textV2); // MD file should be updated
    await runAndValidateCommand('Deploy', 'to', 'ST');
    await utilities.clearOutputView();
    await utilities.closeAllEditors(); // close editor to make sure editor is up to date
  });

  step('Retrieve MD v2 and verify the text not changed', async () => {
    await utilities.openFile(mdPath);
    await runAndValidateCommand('Retrieve', 'from', 'ST');
    textV2AfterRetrieve = await utilities.attemptToFindTextEditorText(mdPath);

    await expect(textV2AfterRetrieve).toContain(textV2); // should be same
  });

  after('Tear down and clean up the testing environment', async () => {
    await utilities.gitCheckout('main', testSetup.projectFolderPath);
    await testSetup?.tearDown();
  });

  const runAndValidateCommand = async (
    operation: string,
    fromTo: string,
    type: string,
  ): Promise<void> => {
    await utilities.executeQuickPick(
      `SFDX: ${operation} This Source ${fromTo} Org`,
      utilities.Duration.seconds(5)
    );

    await validateCommand(operation, fromTo, type);
  };

  const validateCommand = async (
    operation: string,
    fromTo: string,
    type: string, // Text to identify operation type (if it has source tracking enabled, disabled or if it was a deploy on save)
  ): Promise<void> => {
    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      `SFDX: ${operation} This Source ${fromTo} Org successfully ran`,
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    // Verify Output tab
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      `Starting SFDX: ${operation} This Source ${fromTo}`,
      10
    );
    utilities.log(
      `${operation} time ${type}: ` + (await utilities.getOperationTime(outputPanelText!))
    );
    await expect(outputPanelText).not.toBeUndefined();
    await expect(outputPanelText).toContain(
      `${operation}ed Source`.replace('Retrieveed', 'Retrieved')
    );
    await expect(outputPanelText).toContain(`Account.Deploy_Test__c  CustomField`);
    await expect(outputPanelText).toContain(`ended SFDX: ${operation} This Source ${fromTo} Org`);
  };
});
