/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { DefaultTreeItem, TreeItem, ViewSection, Workbench } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('SObjects Definitions', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: true,
    testSuiteSuffixName: 'sObjectsDefinitions'
  }
  let projectName: string;

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName.toUpperCase();

    utilities.log(`${testSetup.testSuiteSuffixName} - calling createCustomObjects()`);
    await utilities.createCustomObjects(testSetup);
  });

  step(`Check Custom Objects 'Customer__c' and 'Product__c' are within objects folder`, async () => {
      utilities.log(
        `${testSetup.testSuiteSuffixName} - Check Custom Objects 'Customer__c' and 'Product__c' are within objects folder`
      );
      const workbench = await utilities.getWorkbench();
      const sidebar = workbench.getSideBar();
      const content = sidebar.getContent();

      const treeViewSection = await content.getSection(projectName);
      await expect(treeViewSection).toBeDefined();

      const objectTreeItem = (await treeViewSection.findItem('objects')) as DefaultTreeItem;
      await expect(objectTreeItem).toBeDefined();
      await objectTreeItem.select();

      const customerObjectFolder = (await objectTreeItem.findChildItem(
        'Customer__c'
      )) as DefaultTreeItem;
      await expect(customerObjectFolder).toBeDefined();

      await customerObjectFolder?.expand();
      await expect(await customerObjectFolder?.isExpanded()).toBe(true);

      const customerCustomObject = await utilities.getVisibleChild(
        customerObjectFolder,
        'Customer__c.object-meta.xml'
      );
      await expect(customerCustomObject).toBeDefined();

      const productObjectFolder = (await objectTreeItem.findChildItem(
        'Product__c'
      )) as DefaultTreeItem;
      await expect(productObjectFolder).toBeDefined();

      await productObjectFolder?.expand();
      await expect(await productObjectFolder?.isExpanded()).toBe(true);

      const productCustomObject = await utilities.getVisibleChild(
        productObjectFolder,
        'Product__c.object-meta.xml'
      );
      await expect(productCustomObject).toBeDefined();
    }
  );

  step('Push Source to Org', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Push Source to Org`);
    await utilities.executeQuickPick(
      'SFDX: Push Source to Default Org',
      utilities.Duration.seconds(5)
    );
    await utilities.pause(utilities.Duration.seconds(1));

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Push Source to Default Org successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Push Source to Default Org',
      5
    );
    await expect(outputPanelText).toBeDefined();
    await expect(outputPanelText).toContain('Pushed Source');
  });

  step('Refresh SObject Definitions for Custom SObjects', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Refresh SObject Definitions for Custom SObjects`
    );
    await refreshSObjectDefinitions('Custom SObjects');

    await verifyOutputPanelText('Custom sObjects', 2);

    const workbench = await utilities.getWorkbench();
    const treeViewSection = await verifySObjectFolders(workbench, projectName, 'customObjects');

    // Verify if custom Objects Customer__c and Product__c are within 'customObjects' folder
    const customerCustomObject = await treeViewSection.findItem('Customer__c.cls');
    await expect(customerCustomObject).toBeDefined();
    const productCustomObject = await treeViewSection.findItem('Product__c.cls');
    await expect(productCustomObject).toBeDefined();
  });

  step('Refresh SObject Definitions for Standard SObjects', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Refresh SObject Definitions for Standard SObjects`
    );
    await refreshSObjectDefinitions('Standard SObjects');

    await verifyOutputPanelText('Standard sObjects');

    const workbench = await utilities.getWorkbench();
    const treeViewSection = await verifySObjectFolders(workbench, projectName, 'standardObjects');

    const accountSObject = await treeViewSection.findItem('Account.cls');
    await expect(accountSObject).toBeDefined();

    const accountCleanInfoSObject = await treeViewSection.findItem('AccountCleanInfo.cls');
    await expect(accountCleanInfoSObject).toBeDefined();

    const acceptedEventRelationSObject = await treeViewSection.findItem(
      'AcceptedEventRelation.cls'
    );
    await expect(acceptedEventRelationSObject).toBeDefined();
  });

  step('Refresh SObject Definitions for All SObjects', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Refresh SObject Definitions for All SObjects`
    );
    await refreshSObjectDefinitions('All SObjects');

    await verifyOutputPanelText('Standard sObjects');
    await verifyOutputPanelText('Custom sObjects', 2);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});

async function verifyOutputPanelText(type: string, qty?: number): Promise<void> {
  utilities.log(`calling verifyOutputPanelText(${type})`);
  const outputPanelText = (await utilities.attemptToFindOutputPanelText(
    'Salesforce CLI',
    'sObjects',
    10
  )) as string;
  await expect(outputPanelText).toBeDefined();
  const expectedTexts = [
    `Starting SFDX: Refresh SObject Definitions`,
    `sf sobject definitions refresh`,
    `Processed ${qty || ''}`,
    `${type}`,
    `ended with exit code 0`
  ];
  await utilities.verifyOutputPanelText(outputPanelText, expectedTexts);
}

async function refreshSObjectDefinitions(type: string): Promise<void> {
  utilities.log(`calling refreshSObjectDefinitions(${type})`);
  await utilities.clearOutputView(utilities.Duration.seconds(2));
  const prompt = await utilities.executeQuickPick(
    'SFDX: Refresh SObject Definitions',
    utilities.Duration.seconds(2)
  );
  await prompt.setText(type);
  await prompt.selectQuickPick(type);
  await utilities.pause(utilities.Duration.seconds(1));

  const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
    'SFDX: Refresh SObject Definitions successfully ran',
    utilities.Duration.TEN_MINUTES
  );
  await expect(successNotificationWasFound).toBe(true);
}

async function verifySObjectFolders(
  workbench: Workbench,
  projectName: string,
  folder: string
): Promise<ViewSection> {
  utilities.log(`calling verifySObjectFolders(workbench, ${projectName}, ${folder})`);
  const sidebar = workbench.getSideBar();
  const content = sidebar.getContent();
  const treeViewSection = await content.getSection(projectName);
  await expect(treeViewSection).toBeDefined();

  // Verify if '.sfdx' folder is in side panel
  const sfdxTreeItem = (await treeViewSection.findItem('.sfdx')) as DefaultTreeItem;
  await expect(sfdxTreeItem).toBeDefined();
  await sfdxTreeItem.expand();
  await expect(await sfdxTreeItem.isExpanded()).toBe(true);
  await utilities.pause(utilities.Duration.seconds(1));

  // Verify if 'tools' folder is within '.sfdx'
  const toolsTreeItem = (await sfdxTreeItem.findChildItem('tools')) as TreeItem;
  await expect(toolsTreeItem).toBeDefined();
  await toolsTreeItem.expand();
  await expect(await toolsTreeItem.isExpanded()).toBe(true);
  await utilities.pause(utilities.Duration.seconds(1));

  // Verify if 'sobjects' folder is within 'tools'
  const sobjectsTreeItem = (await utilities.getVisibleChild(sfdxTreeItem, 'sobjects')) as TreeItem;
  await expect(sobjectsTreeItem).toBeDefined();
  await sobjectsTreeItem.expand();
  await expect(await sobjectsTreeItem.isExpanded()).toBe(true);
  await utilities.pause(utilities.Duration.seconds(1));

  // Verify if 'type' folder is within 'sobjects'
  const objectsTreeItem = (await utilities.getVisibleChild(sfdxTreeItem, folder)) as TreeItem;
  await expect(objectsTreeItem).toBeDefined();
  await objectsTreeItem.expand();
  await expect(await objectsTreeItem.isExpanded()).toBe(true);
  await utilities.pause(utilities.Duration.seconds(1));

  return treeViewSection;
}
