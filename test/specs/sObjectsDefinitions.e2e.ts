/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { DefaultTreeItem, TreeItem } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('SObjects Definitions', async () => {
  let testSetup: TestSetup;
  let projectName: string;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('sObjectsDefinitions', false);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();

    utilities.log(`${testSetup.testSuiteSuffixName} - calling createCustomObjects()`);
    await utilities.createCustomObjects(testSetup);
  });

  step('Check Custom Objects Customer and Product are within objects folder', async () => {
    const workbench = await utilities.getWorkbench();
    const sidebar = workbench.getSideBar();
    const content = sidebar.getContent();

    const treeViewSection = await content.getSection(projectName);
    expect(treeViewSection).not.toEqual(undefined);

    const objectTreeItem = (await treeViewSection.findItem('objects')) as DefaultTreeItem;
    expect(objectTreeItem).not.toEqual(undefined);
    await objectTreeItem.select();

    const customerObjectFolder = (await objectTreeItem.findChildItem(
      'Customer__c'
    )) as DefaultTreeItem;
    expect(customerObjectFolder).not.toEqual(undefined);

    await customerObjectFolder?.expand();
    expect(await customerObjectFolder?.isExpanded()).toBe(true);

    const customerCustomObject = await utilities.getVisibleChild(
      customerObjectFolder,
      'Customer__c.object-meta.xml'
    );
    expect(customerCustomObject).not.toEqual(undefined);

    const productObjectFolder = (await objectTreeItem.findChildItem(
      'Product__c'
    )) as DefaultTreeItem;
    expect(productObjectFolder).not.toEqual(undefined);

    await productObjectFolder?.expand();
    expect(await productObjectFolder?.isExpanded()).toBe(true);

    const productCustomObject = await utilities.getVisibleChild(
      productObjectFolder,
      'Product__c.object-meta.xml'
    );
    expect(productCustomObject).not.toEqual(undefined);
  });

  step('Push Source to Org', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('SFDX: Push Source to Default Org', 5);
    await utilities.pause(1);

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Push Source to Default Org successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Push Source to Default Org',
      5
    );
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Pushed Source');
  });

  step('Refresh SObject Definitions for Custom SObjects', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('View: Clear Output', 2);
    const prompt = await utilities.executeQuickPick(
      workbench,
      'SFDX: Refresh SObject Definitions',
      2
    );
    await prompt.setText('Custom SObjects');
    await prompt.selectQuickPick('Custom SObjects');
    await utilities.pause(1);

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Refresh SObject Definitions successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'sObjects',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    // Search for 'Processed xxx Custom sObjects'
    const matchedResults = outputPanelText?.match(/Processed [0-9]{1,} Custom sObjects/gm);
    expect(matchedResults).not.toBe(undefined);
    expect(matchedResults!.length).toBe(1);
    const customObjectCount = parseInt(
      matchedResults![matchedResults!.length - 1].match(/[0-9]{1,}/)![0]
    );

    // The total number of custom objects created is 2
    expect(customObjectCount).toBe(2);

    const sidebar = workbench.getSideBar();
    const content = sidebar.getContent();
    const treeViewSection = await content.getSection(projectName);
    expect(treeViewSection).not.toEqual(undefined);

    // Verify if '.sfdx' folder is in side panel
    const sfdxTreeItem = (await treeViewSection.findItem('.sfdx')) as DefaultTreeItem;
    expect(sfdxTreeItem).not.toEqual(undefined);
    await sfdxTreeItem.expand();
    expect(await sfdxTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);

    // Verify if 'tools' folder is within '.sfdx'
    const toolsTreeItem = (await sfdxTreeItem.findChildItem('tools')) as TreeItem;
    expect(toolsTreeItem).not.toEqual(undefined);
    await toolsTreeItem.expand();
    expect(await toolsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);

    // Verify if 'sobjects' folder is within 'tools'
    let sobjectsTreeItem = await utilities.getVisibleChild(sfdxTreeItem, 'sobjects');
    expect(sobjectsTreeItem).not.toEqual(undefined);
    sobjectsTreeItem = sobjectsTreeItem!;

    await sobjectsTreeItem.expand();
    expect(await sobjectsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);

    // Verify if 'customObjects' folder is within 'sobjects'
    let customObjectsTreeItem = await utilities.getVisibleChild(sfdxTreeItem, 'customObjects');
    expect(customObjectsTreeItem).not.toEqual(undefined);
    customObjectsTreeItem = customObjectsTreeItem!;

    await customObjectsTreeItem.expand();
    expect(await customObjectsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);

    // Verify if custom Objects Customer__c and Product__c are within 'customObjects' folder
    const customerCustomObject = await treeViewSection.findItem('Customer__c.cls');
    expect(customerCustomObject).not.toBe(undefined);
    const productCustomObject = await treeViewSection.findItem('Product__c.cls');
    expect(productCustomObject).not.toBe(undefined);
  });

  step('Refresh SObject Definitions for Standard SObjects', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('View: Clear Output', 2);
    const prompt = await utilities.executeQuickPick(
      workbench,
      'SFDX: Refresh SObject Definitions',
      5
    );
    await prompt.setText('Standard SObjects');
    await prompt.selectQuickPick('Standard SObjects');
    await utilities.pause(1);

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Refresh SObject Definitions successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Search for 'sObjects' to obtain the whole text in output panel'
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'sObjects',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    // Search for 'Processed xxx Standard sObjects'
    const matchedResults = outputPanelText?.match(/Processed [0-9]{1,} Standard sObjects/gm);
    expect(matchedResults).not.toBe(undefined);
    expect(matchedResults!.length).toBe(1);
    const sObjectCount = parseInt(
      matchedResults![matchedResults!.length - 1].match(/[0-9]{1,}/)![0]
    );
    expect(sObjectCount).toBeGreaterThan(400);

    const sidebar = workbench.getSideBar();
    const content = sidebar.getContent();
    const treeViewSection = await content.getSection(projectName);
    expect(treeViewSection).not.toEqual(undefined);

    // Verify if 'standardObjects' folder is in side panel
    const standardObjectsTreeItem = (await treeViewSection.findItem(
      'standardObjects'
    )) as DefaultTreeItem;
    expect(standardObjectsTreeItem).not.toEqual(undefined);
    await standardObjectsTreeItem.expand();
    expect(await standardObjectsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);

    const accountSObject = await treeViewSection.findItem('Account.cls');
    expect(accountSObject).not.toBe(undefined);

    const accountCleanInfoSObject = await treeViewSection.findItem('AccountCleanInfo.cls');
    expect(accountCleanInfoSObject).not.toBe(undefined);

    const acceptedEventRelationSObject = await treeViewSection.findItem(
      'AcceptedEventRelation.cls'
    );
    expect(acceptedEventRelationSObject).not.toBe(undefined);
  });

  step('Refresh SObject Definitions for All SObjects', async () => {
    // Clear the output for correct test validation.
    const workbench = await utilities.getWorkbench();
    await utilities.executeQuickPick('View: Clear Output', 2);

    const prompt = await utilities.executeQuickPick(
      workbench,
      'SFDX: Refresh SObject Definitions',
      5
    );
    await prompt.setText('All SObjects');
    await prompt.selectQuickPick('All SObjects');
    await utilities.pause(1);

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'SFDX: Refresh SObject Definitions successfully ran',
      utilities.TEN_MINUTES
    );
    expect(successNotificationWasFound).toBe(true);

    // Search for 'sObjects' to obtain the whole text in output panel'
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'sObjects',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    // Search for 'Processed xxx Standard sObjects'
    const matchedStandardResults = outputPanelText?.match(
      /Processed [0-9]{1,} Standard sObjects/gm
    );
    expect(matchedStandardResults).not.toBe(undefined);
    expect(matchedStandardResults!.length).toBe(1);
    const standardObjectCount = parseInt(matchedStandardResults![0].match(/[0-9]{1,}/)![0]);
    expect(standardObjectCount).toBeGreaterThan(400);

    // Search for 'Processed xxx Custom sObjects'
    const matchedCustomResults = outputPanelText?.match(/Processed [0-9]{1,} Custom sObjects/gm);
    expect(matchedCustomResults).not.toBe(undefined);
    expect(matchedCustomResults!.length).toBe(1);
    const customObjectCount = parseInt(matchedCustomResults![0].match(/[0-9]{1,}/)![0]);
    expect(customObjectCount).toBe(2);
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
