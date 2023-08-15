/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { step } from 'mocha-steps';
import path from 'path';
import { TextEditor } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('Templates', async () => {
  let testSetup: TestSetup;
  let projectName: string;

  // Set up
  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('Templates', false);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();
  });

  // Apex Class
  step('Create an Apex Class', async () => {
    // Using the Command palette, run SFDX: Create Apex Class.
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Apex Class',
      1
    );

    // Set the name of the new component to ApexClass1.
    await inputBox.setText('ApexClass1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Apex Class successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Apex Class',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    const classPath = path.join('force-app', 'main', 'default', 'classes', 'ApexClass1.cls');
    expect(outputPanelText).toContain(`create ${classPath}`);

    const metadataPath = path.join(
      'force-app',
      'main',
      'default',
      'classes',
      'ApexClass1.cls-meta.xml'
    );
    expect(outputPanelText).toContain(`create ${metadataPath}`);

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Get the matching (visible) items within the tree which contains "ApexClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexClass1'
    );

    expect(filteredTreeViewItems.includes('ApexClass1.cls')).toBe(true);
    expect(filteredTreeViewItems.includes('ApexClass1.cls-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Apex Class', async () => {
    const expectedText = [
      'public with sharing class ApexClass1 {',
      '    public ApexClass1() {',
      '',
      '    }',
      '}'
    ].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('ApexClass1.cls')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Apex Trigger
  step('Create an Apex Trigger', async () => {
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Apex Trigger".
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Apex Trigger',
      1
    );

    // Set the name of the new component to ApexTrigger1.
    await inputBox.setText('ApexTrigger1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Apex Trigger successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Apex Trigger',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    const triggerPath = path.join(
      'force-app',
      'main',
      'default',
      'triggers',
      'ApexTrigger1.trigger'
    );
    expect(outputPanelText).toContain(`create ${triggerPath}`);

    const metadataPath = path.join(
      'force-app',
      'main',
      'default',
      'triggers',
      'ApexTrigger1.trigger-meta.xml'
    );
    expect(outputPanelText).toContain(`create ${metadataPath}`);

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Get the matching (visible) items within the tree which contains "ApexTrigger1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexTrigger1'
    );
    expect(filteredTreeViewItems.includes('ApexTrigger1.trigger')).toBe(true);
    expect(filteredTreeViewItems.includes('ApexTrigger1.trigger-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Apex Trigger', async () => {
    // Verify the default trigger.
    const expectedText = ['trigger ApexTrigger1 on SOBJECT (before insert) {', '', '}'].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('ApexTrigger1.trigger')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura App
  step('Create an Aura App', async () => {
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Aura App".
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Aura App',
      1
    );

    // Set the name of the new component to AuraApp1.
    await inputBox.setText('AuraApp1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Aura App successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Aura App',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    const appPath = path.join('force-app', 'main', 'default', 'aura', 'AuraApp1', 'AuraApp1.app');
    expect(outputPanelText).toContain(`create ${appPath}`);

    const metadataPath = path.join(
      'force-app',
      'main',
      'default',
      'aura',
      'AuraApp1',
      'AuraApp1.app-meta.xml'
    );
    expect(outputPanelText).toContain(`create ${metadataPath}`);

    const docPath = path.join(
      'force-app',
      'main',
      'default',
      'aura',
      'AuraApp1',
      'AuraApp1.auradoc'
    );
    expect(outputPanelText).toContain(`create ${docPath}`);

    const cssPath = path.join('force-app', 'main', 'default', 'aura', 'AuraApp1', 'AuraApp1.css');
    expect(outputPanelText).toContain(`create ${cssPath}`);

    const svgPath = path.join('force-app', 'main', 'default', 'aura', 'AuraApp1', 'AuraApp1.svg');
    expect(outputPanelText).toContain(`create ${svgPath}`);

    const controllerPath = path.join(
      'force-app',
      'main',
      'default',
      'aura',
      'AuraApp1',
      'AuraApp1Controller.js'
    );
    expect(outputPanelText).toContain(`create ${controllerPath}`);

    const helperPath = path.join(
      'force-app',
      'main',
      'default',
      'aura',
      'AuraApp1',
      'AuraApp1Helper.js'
    );
    expect(outputPanelText).toContain(`create ${helperPath}`);

    const rendererPath = path.join(
      'force-app',
      'main',
      'default',
      'aura',
      'AuraApp1',
      'AuraApp1Renderer.js'
    );
    expect(outputPanelText).toContain(`create ${rendererPath}`);

    // Get the matching (visible) items within the tree which contains "AuraApp1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'AuraApp1'
    );
    expect(filteredTreeViewItems.includes('AuraApp1.app')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraApp1.app-meta.xml')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraApp1.auradoc')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraApp1.css')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraApp1.svg')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraApp1Controller.js')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraApp1Helper.js')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraApp1Renderer.js')).toBe(true);
  });

  step('Verify the contents of the Aura App', async () => {
    // Verify the default code for an Aura App.
    const expectedText = ['<aura:application>', '', '</aura:application>'].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('AuraApp1.app')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura Component
  step('Create an Aura Component', async () => {
    // Using the Command palette, run SFDX: Create Aura Component.
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Aura Component',
      1
    );

    // Set the name of the new component to auraComponent1.
    await inputBox.setText('auraComponent1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Aura Component successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Aura Component',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    // Zoom out so all tree items are visible
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
    // Check for the presence of the directory, "auraComponent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'auraComponent1'
    );
    expect(filteredTreeViewItems.includes('auraComponent1')).toBe(true);

    // It's a tree, but it's also a list.  Everything in the view is actually flat
    // and returned from the call to visibleItems.reduce().
    expect(filteredTreeViewItems.includes('auraComponent1.cmp')).toBe(true);
    expect(filteredTreeViewItems.includes('auraComponent1.cmp-meta.xml')).toBe(true);
    expect(filteredTreeViewItems.includes('auraComponent1Controller.js')).toBe(true);
    expect(filteredTreeViewItems.includes('auraComponent1Helper.js')).toBe(true);
    expect(filteredTreeViewItems.includes('auraComponent1Renderer.js')).toBe(true);

    // Could also check for .auradoc, .css, .design, and .svg, but not as critical
    // and since this could change w/o our knowing, only check for what we need to here.
  });

  step('Verify the contents of the Aura Component', async () => {
    const expectedText = ['<aura:component>', '', '</aura:component>'].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('auraComponent1.cmp')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura Event
  step('Create an Aura Event', async () => {
    // Using the Command palette, run SFDX: Create Aura Component.
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Aura Event',
      1
    );

    // Set the name of the new component to auraComponent1.
    await inputBox.setText('auraEvent1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Aura Event successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Aura Event',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Check for the presence of the directory, "auraEvent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'auraEvent1'
    );
    expect(filteredTreeViewItems.includes('auraEvent1')).toBe(true);

    expect(filteredTreeViewItems.includes('auraEvent1.evt')).toBe(true);
    expect(filteredTreeViewItems.includes('auraEvent1.evt-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Aura Event', async () => {
    const expectedText = ['<aura:event type="APPLICATION" description="Event template"/>'].join(
      '\n'
    );
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('auraEvent1.evt')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura Interface
  step('Create an Aura Interface', async () => {
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Aura Interface".
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Aura Interface',
      1
    );

    // Set the name of the new interface to AuraInterface1.
    await inputBox.setText('AuraInterface1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Aura Interface successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Aura Interface',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    const interfacePath = path.join(
      'force-app',
      'main',
      'default',
      'aura',
      'AuraInterface1',
      'AuraInterface1.intf'
    );
    expect(outputPanelText).toContain(`create ${interfacePath}`);

    const metadataPath = path.join(
      'force-app',
      'main',
      'default',
      'aura',
      'AuraInterface1',
      'AuraInterface1.intf-meta.xml'
    );
    expect(outputPanelText).toContain(`create ${metadataPath}`);

    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'AuraInterface1'
    );

    expect(filteredTreeViewItems.includes('AuraInterface1.intf')).toBe(true);
    expect(filteredTreeViewItems.includes('AuraInterface1.intf-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Aura Interface', async () => {
    // Verify the default code for an Aura Interface.
    const expectedText = [
      '<aura:interface description="Interface template">',
      '  <aura:attribute name="example" type="String" default="" description="An example attribute."/>',
      '</aura:interface>'
    ].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('AuraInterface1.intf')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Lightning Web Component
  step('Create Lightning Web Component', async () => {
    // Using the Command palette, run SFDX: Create Lightning Web Component.
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Lightning Web Component',
      1
    );

    // Set the name of the new component to lightningWebComponent1.
    await inputBox.setText('lightningWebComponent1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Lightning Web Component successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Lightning Web Component',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Check for the presence of the directory, "lightningWebComponent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'lightningWebComponent1'
    );
    expect(filteredTreeViewItems.includes('lightningWebComponent1')).toBe(true);

    expect(filteredTreeViewItems.includes('lightningWebComponent1.html')).toBe(true);
    expect(filteredTreeViewItems.includes('lightningWebComponent1.js')).toBe(true);
    expect(filteredTreeViewItems.includes('lightningWebComponent1.js-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Lightning Web Component', async () => {
    const expectedText = [
      `import { LightningElement } from 'lwc';`,
      '',
      'export default class LightningWebComponent1 extends LightningElement {}'
    ].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('lightningWebComponent1.js')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Visualforce Component
  step('Create a Visualforce Component', async () => {
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Visualforce Component".
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Visualforce Component',
      1
    );

    // Set the name of the new component to VisualforceCmp1.
    await inputBox.setText('VisualforceCmp1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Visualforce Component successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Visualforce Component',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    const componentPath = path.join(
      'force-app',
      'main',
      'default',
      'components',
      'VisualforceCmp1.component'
    );
    expect(outputPanelText).toContain(`create ${componentPath}`);

    const metadataPath = path.join(
      'force-app',
      'main',
      'default',
      'components',
      'VisualforceCmp1.component-meta.xml'
    );
    expect(outputPanelText).toContain(`create ${metadataPath}`);

    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'VisualforceCmp1'
    );
    expect(filteredTreeViewItems.includes('VisualforceCmp1.component')).toBe(true);
    expect(filteredTreeViewItems.includes('VisualforceCmp1.component-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Visualforce Component', async () => {
    // Verify the default code for a Visualforce Component.
    const expectedText = [
      '<apex:component>',
      '<!-- Begin Default Content REMOVE THIS -->',
      '<h1>Congratulations</h1>',
      'This is your new Component',
      '<!-- End Default Content REMOVE THIS -->',
      '</apex:component>'
    ].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('VisualforceCmp1.component')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Visualforce Page
  step('Create a Visualforce Page', async () => {
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Visualforce Page".
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Create Visualforce Page',
      1
    );

    // Set the name of the new page to VisualforcePage1.
    await inputBox.setText('VisualforcePage1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(
      workbench,
      'SFDX: Create Visualforce Page successfully ran',
      10
    );
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Visualforce Page',
      10
    );
    expect(outputPanelText).not.toBeUndefined();

    const visualforcePagePath = path.join(
      'force-app',
      'main',
      'default',
      'pages',
      'VisualforcePage1.page'
    );
    expect(outputPanelText).toContain(`create ${visualforcePagePath}`);

    const metadataPath = path.join(
      'force-app',
      'main',
      'default',
      'pages',
      'VisualforcePage1.page-meta.xml'
    );
    expect(outputPanelText).toContain(`create ${metadataPath}`);

    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'VisualforcePage1'
    );
    expect(filteredTreeViewItems.includes('VisualforcePage1.page')).toBe(true);
    expect(filteredTreeViewItems.includes('VisualforcePage1.page-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Visualforce Page', async () => {
    // Verify the default code for a Visualforce Page.
    const expectedText = [
      '<apex:page>',
      '<!-- Begin Default Content REMOVE THIS -->',
      '<h1>Congratulations</h1>',
      'This is your new Page',
      '<!-- End Default Content REMOVE THIS -->',
      '</apex:page>'
    ].join('\n');
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = await workbench.getEditorView();
    const textEditor = (await editorView.openEditor('VisualforcePage1.page')) as TextEditor;
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Tear down
  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
