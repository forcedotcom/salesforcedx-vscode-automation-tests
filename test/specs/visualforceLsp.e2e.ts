/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import path from 'path';
import { RefactoredTestSetup } from '../RefactoredTestSetup.ts';
import * as utilities from '../utilities/index.ts';

describe('Visualforce LSP', async () => {
  const testSetup = new RefactoredTestSetup();
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'VisualforceLsp'
  }

  step('Set up the testing environment', async () => {
    utilities.log('VisualforceLsp - Set up the testing environment');
    await testSetup.setUp(testReqConfig);

    utilities.log(`${testSetup.testSuiteSuffixName} - calling createApexController()`);
    // Create Apex controller for the Visualforce Page
    await utilities.createApexController();

    utilities.log(`${testSetup.testSuiteSuffixName} - calling createVisualforcePage()`);
    // Clear output before running the command
    const workbench = await utilities.getWorkbench();
    await utilities.clearOutputView();
    // Create Visualforce Page
    await utilities.createVisualforcePage();

    // Check output panel to validate file was created...
    const outputPanelText = await utilities.attemptToFindOutputPanelText(
      'Salesforce CLI',
      'Starting SFDX: Create Visualforce Page',
      10
    );
    await expect(outputPanelText).not.toBeUndefined();
    const pathToPagesFolder = path.join(
      testSetup.projectFolderPath!,
      'force-app',
      'main',
      'default',
      'pages'
    );
    await expect(outputPanelText?.toLowerCase()).toContain(
      `target dir = ${pathToPagesFolder.toLowerCase()}`
    );
    const pathToPage = path.join('force-app', 'main', 'default', 'pages', 'FooPage.page');
    await expect(outputPanelText).toContain(`create ${pathToPage}`);
    await expect(outputPanelText).toContain(`create ${pathToPage}-meta.xml`);
    await expect(outputPanelText).toContain('Finished SFDX: Create Visualforce Page');

    // Get open text editor and verify file content
    const textEditor = await utilities.getTextEditor(workbench, 'FooPage.page');
    const fileContent = await textEditor.getText();
    await expect(fileContent).toContain('<apex:page controller="myController" tabStyle="Account">');
    await expect(fileContent).toContain('</apex:page>');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    await utilities.showRunningExtensions();
    await utilities.zoom('Out', 4, utilities.Duration.seconds(1));
    // Verify Visualforce extension is present and running

    const foundExtensions = await utilities.findExtensionsInRunningExtensionsList([
      'salesforcedx-vscode-visualforce'
    ]);
    await utilities.zoomReset();
    await expect(foundExtensions.length).toBe(1);
  });

  xstep('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'FooPage.page');
    await textEditor.moveCursor(1, 25);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(utilities.Duration.seconds(1));

    // TODO: go to definition is actually not working

    // // Verify 'Go to definition' took us to the definition file
    // const activeTab = await editorView.getActiveTab();
    // const title = await activeTab?.getTitle();
    // await expect(title).toBe('MyController.cls');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'FooPage.page');
    await textEditor.typeTextAt(3, 1, '\t\t<apex:pageM');
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    const ariaHasPopupAttribute = await autocompletionOptions[0].getAttribute('aria-haspopup');
    await expect(ariaHasPopupAttribute).toBe('true');

    const ariaAutocompleteAttribute =
      await autocompletionOptions[0].getAttribute('aria-autocomplete');
    await expect(ariaAutocompleteAttribute).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.typeText('/>');
    await textEditor.save();
    await utilities.pause(utilities.Duration.seconds(1));
    const line3Text = await textEditor.getTextAtLine(3);
    await expect(line3Text).toContain('apex:pageMessage');
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup?.tearDown();
  });
});
