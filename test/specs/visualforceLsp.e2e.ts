/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import path from 'path';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('Visualforce LSP', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('VisualforceLsp - Set up the testing environment');
    testSetup = new TestSetup('VisualforceLsp', false);
    await testSetup.setUp();

    utilities.log(`${testSetup.testSuiteSuffixName} - calling createApexController()`);
    // Create Apex controller for the Visualforce Page
    await utilities.createApexController();

    utilities.log(`${testSetup.testSuiteSuffixName} - calling createVisualforcePage()`);
    // Clear output before running the command
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Clear Output', 1);
    // Create Visualforce Page
    await utilities.createVisualforcePage();

    // Check output panel to validate file was created...
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Create Visualforce Page',
      10
    );
    expect(outputPanelText).not.toBeUndefined();
    const pathToPagesFolder = path.join(
      testSetup.projectFolderPath!,
      'force-app',
      'main',
      'default',
      'pages'
    );
    expect(outputPanelText?.toLowerCase()).toContain(
      `target dir = ${pathToPagesFolder.toLowerCase()}`
    );
    const pathToPage = path.join('force-app', 'main', 'default', 'pages', 'FooPage.page');
    expect(outputPanelText).toContain(`create ${pathToPage}`);
    expect(outputPanelText).toContain(`create ${pathToPage}-meta.xml`);
    expect(outputPanelText).toContain('Finished SFDX: Create Visualforce Page');

    // Get open text editor and verify file content
    const textEditor = await utilities.getTextEditor(workbench, 'FooPage.page');
    const fileContent = await textEditor.getText();
    expect(fileContent).toContain('<apex:page controller="myController" tabStyle="Account">');
    expect(fileContent).toContain('</apex:page>');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.showRunningExtensions(workbench);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);

    // Verify Visualforce extension is present and running
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
      workbench,
      'salesforcedx-vscode-visualforce'
    );
    expect(extensionWasFound).toBe(true);
  });

  xstep('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const textEditor = await utilities.getTextEditor(workbench, 'FooPage.page');
    await textEditor.moveCursor(1, 25);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // TODO: go to definition is actually not working

    // // Verify 'Go to definition' took us to the definition file
    // const activeTab = await editorView.getActiveTab();
    // const title = await activeTab?.getTitle();
    // expect(title).toBe('MyController.cls');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const textEditor = await utilities.getTextEditor(workbench, 'FooPage.page');
    await textEditor.typeTextAt(3, 1, '\t\t<apex:pageM');
    await utilities.pause(1);

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    const ariaHasPopupAttribute = await autocompletionOptions[0].getAttribute('aria-haspopup');
    expect(ariaHasPopupAttribute).toBe('true');

    const ariaAutocompleteAttribute =
      await autocompletionOptions[0].getAttribute('aria-autocomplete');
    expect(ariaAutocompleteAttribute).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.typeText('/>');
    await textEditor.save();
    await utilities.pause(1);
    const line3Text = await textEditor.getTextAtLine(3);
    expect(line3Text).toContain('apex:pageMessage');
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
