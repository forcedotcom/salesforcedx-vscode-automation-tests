/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import child_process from 'child_process';
import { step, xstep } from 'mocha-steps';
import path from 'path';
import util from 'util';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import * as analyticsTemplate from '../testData/sampleAnalyticsTemplateData.ts';

const exec = util.promisify(child_process.exec);

describe('Templates', async () => {
  let testSetup: TestSetup;
  let projectName: string;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'Templates'
  }


  // Set up
  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
    projectName = testSetup.tempProjectName.toUpperCase();
  });

  // Apex Class
  step('Create an Apex Class', async () => {
    // Using the Command palette, run SFDX: Create Apex Class.
    await utilities.createCommand('Apex Class', 'ApexClass1', 'classes', 'cls');

    // Check for expected items in the Explorer view.
    const workbench = await utilities.getWorkbench();
    await utilities.expandSideBar(workbench, projectName);

    // Get the matching (visible) items within the tree which contains "ApexClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexClass1'
    );

    await expect(filteredTreeViewItems.includes('ApexClass1.cls')).toBe(true);
    await expect(filteredTreeViewItems.includes('ApexClass1.cls-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Apex Class', async () => {
    const expectedText = [
      'public with sharing class ApexClass1 {',
      '    public ApexClass1() {',
      '',
      '    }',
      '}'
    ].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ApexClass1.cls');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Apex Unit Test Class
  step('Create an Apex Unit Test Class', async () => {
    // Using the Command palette, run SFDX: Create Apex Unit Test Class.
    await utilities.createCommand('Apex Unit Test Class', 'ApexUnitTestClass1', 'classes', 'cls');

    // Check for expected items in the Explorer view.
    const workbench = await utilities.getWorkbench();
    await utilities.expandSideBar(workbench, projectName);

    // Get the matching (visible) items within the tree which contains "ApexUnitTestClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexUnitTestClass1'
    );

    await expect(filteredTreeViewItems.includes('ApexUnitTestClass1.cls')).toBe(true);
    await expect(filteredTreeViewItems.includes('ApexUnitTestClass1.cls-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Apex Unit Test Class', async () => {
    const expectedText = [
      '@isTest',
      'private class ApexUnitTestClass1 {',
      '',
      '    @isTest',
      '    static void myUnitTest() {',
      '        // TO DO: implement unit test',
      '    }',
      '}'
    ].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ApexUnitTestClass1.cls');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toContain(expectedText);
  });

  // Apex Trigger
  step('Create an Apex Trigger', async () => {
    // Using the Command palette, run "SFDX: Create Apex Trigger".
    await utilities.createCommand('Apex Trigger', 'ApexTrigger1', 'triggers', 'trigger');

    // Check for expected items in the Explorer view.
    const workbench = await utilities.getWorkbench();
    await utilities.expandSideBar(workbench, projectName);

    // Get the matching (visible) items within the tree which contains "ApexTrigger1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'ApexTrigger1'
    );
    await expect(filteredTreeViewItems.includes('ApexTrigger1.trigger')).toBe(true);
    await expect(filteredTreeViewItems.includes('ApexTrigger1.trigger-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Apex Trigger', async () => {
    // Verify the default trigger.
    const expectedText = ['trigger ApexTrigger1 on SOBJECT (before insert) {', '', '}'].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'ApexTrigger1.trigger');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura App
  step('Create an Aura App', async () => {
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Aura App".
    const outputPanelText = await utilities.createCommand(
      'Aura App',
      'AuraApp1',
      path.join('aura', 'AuraApp1'),
      'app'
    );
    const basePath = path.join('force-app', 'main', 'default', 'aura', 'AuraApp1');
    const docPath = path.join(basePath, 'AuraApp1.auradoc');
    await expect(outputPanelText).toContain(`create ${docPath}`);

    const cssPath = path.join(basePath, 'AuraApp1.css');
    await expect(outputPanelText).toContain(`create ${cssPath}`);

    const svgPath = path.join(basePath, 'AuraApp1.svg');
    await expect(outputPanelText).toContain(`create ${svgPath}`);

    const controllerPath = path.join(basePath, 'AuraApp1Controller.js');
    await expect(outputPanelText).toContain(`create ${controllerPath}`);

    const helperPath = path.join(basePath, 'AuraApp1Helper.js');
    await expect(outputPanelText).toContain(`create ${helperPath}`);

    const rendererPath = path.join(basePath, 'AuraApp1Renderer.js');
    await expect(outputPanelText).toContain(`create ${rendererPath}`);

    // Get the matching (visible) items within the tree which contains "AuraApp1".
    const workbench = await utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'AuraApp1'
    );
    await expect(filteredTreeViewItems.includes('AuraApp1.app')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraApp1.app-meta.xml')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraApp1.auradoc')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraApp1.css')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraApp1.svg')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraApp1Controller.js')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraApp1Helper.js')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraApp1Renderer.js')).toBe(true);
  });

  step('Verify the contents of the Aura App', async () => {
    // Verify the default code for an Aura App.
    const expectedText = ['<aura:application>', '', '</aura:application>'].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'AuraApp1.app');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura Component
  step('Create an Aura Component', async () => {
    // Using the Command palette, run SFDX: Create Aura Component.
    await utilities.createCommand(
      'Aura Component',
      'auraComponent1',
      path.join('aura', 'auraComponent1'),
      'cmp'
    );
    // Zoom out so all tree items are visible
    const workbench = await utilities.getWorkbench();
    await utilities.zoom('Out', 1, utilities.Duration.seconds(2));
    // Check for the presence of the directory, "auraComponent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'auraComponent1'
    );
    await expect(filteredTreeViewItems.includes('auraComponent1')).toBe(true);

    // It's a tree, but it's also a list.  Everything in the view is actually flat
    // and returned from the call to visibleItems.reduce().
    await expect(filteredTreeViewItems.includes('auraComponent1.cmp')).toBe(true);
    await expect(filteredTreeViewItems.includes('auraComponent1.cmp-meta.xml')).toBe(true);
    await expect(filteredTreeViewItems.includes('auraComponent1Controller.js')).toBe(true);
    await expect(filteredTreeViewItems.includes('auraComponent1Helper.js')).toBe(true);
    await expect(filteredTreeViewItems.includes('auraComponent1Renderer.js')).toBe(true);

    // Could also check for .auradoc, .css, .design, and .svg, but not as critical
    // and since this could change w/o our knowing, only check for what we need to here.
  });

  step('Verify the contents of the Aura Component', async () => {
    const expectedText = ['<aura:component>', '', '</aura:component>'].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'auraComponent1.cmp');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura Event
  step('Create an Aura Event', async () => {
    // Using the Command palette, run SFDX: Create Aura Component.
    await utilities.createCommand(
      'Aura Event',
      'auraEvent1',
      path.join('aura', 'auraEvent1'),
      'evt'
    );

    // Check for expected items in the Explorer view.
    const workbench = await utilities.getWorkbench();
    await utilities.expandSideBar(workbench, projectName);

    // Check for the presence of the directory, "auraEvent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'auraEvent1'
    );
    await expect(filteredTreeViewItems.includes('auraEvent1')).toBe(true);
    await expect(filteredTreeViewItems.includes('auraEvent1.evt')).toBe(true);
    await expect(filteredTreeViewItems.includes('auraEvent1.evt-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Aura Event', async () => {
    const expectedText = ['<aura:event type="APPLICATION" description="Event template"/>'].join(
      '\n'
    );
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'auraEvent1.evt');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Aura Interface
  step('Create an Aura Interface', async () => {
    // Using the Command palette, run "SFDX: Create Aura Interface".
    await utilities.createCommand(
      'Aura Interface',
      'AuraInterface1',
      path.join('aura', 'AuraInterface1'),
      'intf'
    );

    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const workbench = await utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'AuraInterface1'
    );

    await expect(filteredTreeViewItems.includes('AuraInterface1.intf')).toBe(true);
    await expect(filteredTreeViewItems.includes('AuraInterface1.intf-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Aura Interface', async () => {
    // Verify the default code for an Aura Interface.
    const expectedText = [
      '<aura:interface description="Interface template">',
      '  <aura:attribute name="example" type="String" default="" description="An example attribute."/>',
      '</aura:interface>'
    ].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'AuraInterface1.intf');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Lightning Web Component
  step('Create Lightning Web Component', async () => {
    // Using the Command palette, run SFDX: Create Lightning Web Component.
    await utilities.createCommand(
      'Lightning Web Component',
      'lightningWebComponent1',
      path.join('lwc', 'lightningWebComponent1'),
      'js'
    );

    // Check for expected items in the Explorer view.
    const workbench = await utilities.getWorkbench();
    await utilities.expandSideBar(workbench, projectName);

    // Check for the presence of the directory, "lightningWebComponent1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'lightningWebComponent1'
    );
    await expect(filteredTreeViewItems.includes('lightningWebComponent1')).toBe(true);
    await expect(filteredTreeViewItems.includes('lightningWebComponent1.html')).toBe(true);
    await expect(filteredTreeViewItems.includes('lightningWebComponent1.js')).toBe(true);
    await expect(filteredTreeViewItems.includes('lightningWebComponent1.js-meta.xml')).toBe(true);
  });

  step('Verify the contents of the Lightning Web Component', async () => {
    const expectedText = [
      `import { LightningElement } from 'lwc';`,
      '',
      'export default class LightningWebComponent1 extends LightningElement {}'
    ].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lightningWebComponent1.js');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Lightning Web Component Test
  xstep('Create Lightning Web Component Test', async () => {
    // Delete previous test file
    const workbench = await utilities.getWorkbench();
    const pathToLwcTest = path.join(
      'force-app',
      'main',
      'default',
      'lwc',
      'lightningWebComponent1',
      '__tests__',
      'lightningWebComponent1.test.js'
    );
    await exec(process.platform == 'win32' ? `del ${pathToLwcTest}` : `rm ${pathToLwcTest}`, {
      cwd: testSetup.projectFolderPath
    });

    // Using the Command palette, run SFDX: Create Lightning Web Component Test.
    const inputBox = await utilities.executeQuickPick(
      'SFDX: Create Lightning Web Component Test',
      utilities.Duration.seconds(1)
    );

    // Set the name of the new test to lightningWebComponent1.
    await inputBox.confirm();
    await inputBox.setText('lightningWebComponent1');
    await inputBox.confirm();
    await utilities.pause(utilities.Duration.seconds(60));

    const failureNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Create Lightning Web Component Test failed to run',
      utilities.Duration.TEN_MINUTES
    );
    await expect(failureNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Create Lightning Web Component Test',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();

    // Check for expected item in the Explorer view.
    await utilities.getTextEditor(workbench, 'lightningWebComponent1.test.js');
    const treeViewSection = await utilities.expandSideBar(workbench, projectName);
    const lwcTestFolder = await treeViewSection.findItem('__tests__');
    await lwcTestFolder?.select();
    const testItem = await treeViewSection.findItem('lightningWebComponent1.test.js');
    await expect(testItem).toBeDefined();
  });

  xstep('Verify the contents of the Lightning Web Component Test', async () => {
    const expectedText = [
      "import { createElement } from 'lwc';",
      "import LightningWebComponent1 from 'c/lightningWebComponent1';",
      '',
      "describe('c-lightning-web-component1', () => {",
      '    afterEach(() => {',
      '        // The jsdom instance is shared across test cases in a single file so reset the DOM',
      '        while (document.body.firstChild) {',
      '            document.body.removeChild(document.body.firstChild);',
      '        }',
      '    });',
      '',
      "    it('TODO: test case generated by CLI command, please fill in test logic', () => {",
      "        const element = createElement('c-lightning-web-component1', {",
      '            is: LightningWebComponent1',
      '        });',
      '        document.body.appendChild(element);',
      '        await expect(1).toBe(2);',
      '    });',
      '});'
    ].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lightningWebComponent1.test.js');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Visualforce Component
  step('Create a Visualforce Component', async () => {
    // Using the Command palette, run "SFDX: Create Visualforce Component".
    await utilities.createCommand(
      'Visualforce Component',
      'VisualforceCmp1',
      'components',
      'component'
    );
    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const workbench = await utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'VisualforceCmp1'
    );
    await expect(filteredTreeViewItems.includes('VisualforceCmp1.component')).toBe(true);
    await expect(filteredTreeViewItems.includes('VisualforceCmp1.component-meta.xml')).toBe(true);
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
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'VisualforceCmp1.component');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Visualforce Page
  step('Create a Visualforce Page', async () => {
    // Using the Command palette, run "SFDX: Create Visualforce Page".
    await utilities.createCommand('Visualforce Page', 'VisualforcePage1', 'pages', 'page');

    // Get the matching (visible) items within the tree which contains "AuraInterface1".
    const workbench = await utilities.getWorkbench();
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(
      workbench,
      projectName,
      'VisualforcePage1'
    );
    await expect(filteredTreeViewItems.includes('VisualforcePage1.page')).toBe(true);
    await expect(filteredTreeViewItems.includes('VisualforcePage1.page-meta.xml')).toBe(true);
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
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'VisualforcePage1.page');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  // Sample Analytics Template
  step('Create a Sample Analytics Template', async () => {
    // Clear the output panel, then use the Command palette to run, "SFDX: Create Sample Analytics Template".
    const workbench = await utilities.getWorkbench();
    await utilities.clearOutputView();
    const inputBox = await utilities.executeQuickPick(
      'SFDX: Create Sample Analytics Template',
      utilities.Duration.seconds(1)
    );

    // Set the name of the new page to sat1
    await inputBox.setText('sat1');
    await inputBox.confirm();
    await utilities.pause(utilities.Duration.seconds(1));

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.notificationIsPresentWithTimeout(
      'SFDX: Create Sample Analytics Template successfully ran',
      utilities.Duration.TEN_MINUTES
    );
    await expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Finished SFDX: Create Sample Analytics Template',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();

    // Check for expected items in the Explorer view.
    await utilities.expandSideBar(workbench, projectName);

    // Check for the presence of the corresponding files
    const treeViewItems = await utilities.getVisibleItemsFromSidebar(workbench, projectName);
    await expect(treeViewItems.includes('dashboards')).toBe(true);
    await expect(treeViewItems.includes('app-to-template-rules.json')).toBe(true);
    await expect(treeViewItems.includes('folder.json')).toBe(true);
    await expect(treeViewItems.includes('releaseNotes.html')).toBe(true);
    await expect(treeViewItems.includes('template-info.json')).toBe(true);
    await expect(treeViewItems.includes('template-to-app-rules.json')).toBe(true);
    await expect(treeViewItems.includes('ui.json')).toBe(true);
    await expect(treeViewItems.includes('variables.json')).toBe(true);
  });

  step('Verify the contents of the Sample Analytics Template', async () => {
    // Verify the default code for a Sample Analytics Template.
    const workbench = await utilities.getWorkbench();
    let textEditor = await utilities.getTextEditor(workbench, 'app-to-template-rules.json');
    let textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(analyticsTemplate.appToTemplateRules);

    textEditor = await utilities.getTextEditor(workbench, 'folder.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(analyticsTemplate.folder);

    textEditor = await utilities.getTextEditor(workbench, 'releaseNotes.html');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(analyticsTemplate.releaseNotes);

    textEditor = await utilities.getTextEditor(workbench, 'template-info.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(analyticsTemplate.templateInfo);

    textEditor = await utilities.getTextEditor(workbench, 'template-to-app-rules.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(analyticsTemplate.templateToAppRules);

    textEditor = await utilities.getTextEditor(workbench, 'ui.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(analyticsTemplate.ui);

    textEditor = await utilities.getTextEditor(workbench, 'variables.json');
    textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(analyticsTemplate.variables);
  });

  // Tear down
  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});
