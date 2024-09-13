import { step } from 'mocha-steps';
import { refactoredTestSetup } from '../refactoredTestSetup.ts';
import * as utilities from '../utilities/index.ts';

// In future we will merge the test together with deployAndRetrieve
describe('metadata deploy and retrieve', async () => {
  const testSetup = new refactoredTestSetup();
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NAMED,
      githubRepoUrl: 'https://github.com/mingxuanzhangsfdx/DeployInv.git'
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'mdDeployRetrieve'
  }
  // const mdPath = 'force-app/main/default/objects/Account/fields/Deploy_Test__c.field-meta.xml';
  let textV1: string;
  let textV2: string;
  let textV2AfterRetrieve: string;

  step('Set up the testing environment', async () => {
    await testSetup.setUp(testReqConfig);
  });

  step('Open and deploy MD v1', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'Deploy_Test__c.field-meta.xml');
    textV1 = await utilities.attemptToFindTextEditorText('Deploy_Test__c.field-meta.xml');
    await runAndValidateCommand('Deploy', 'to', 'ST');
    await utilities.clearOutputView();
  });

  step('Update MD v2 and deploy again', async () => {
    await utilities.gitCheckout('updated-md', testSetup.projectFolderPath);
    textV2 = await utilities.attemptToFindTextEditorText('Deploy_Test__c.field-meta.xml');
    await expect(textV1).not.toEqual(textV2); // MD file should be updated
    await runAndValidateCommand('Deploy', 'to', 'ST');
    await utilities.clearOutputView();
  });

  step('Retrieve MD v2 and verify the text not changed', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'Deploy_Test__c.field-meta.xml');
    await runAndValidateCommand('Retrieve', 'from', 'ST');
    textV2AfterRetrieve = await utilities.attemptToFindTextEditorText('Deploy_Test__c.field-meta.xml');

    await expect(textV2).toContain(textV2AfterRetrieve); // should be same
  });

  after('Tear down and clean up the testing environment', async () => {
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
