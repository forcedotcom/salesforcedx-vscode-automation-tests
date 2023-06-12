/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TextEditor } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import { EnvironmentSettings } from '../environmentSettings';
import { TestSetupWithWExistingProject } from '../TestSetupWithExistingProject';

describe('Apex LSP Perf', async () => {
  let testSetup: TestSetup;

  step('Ensure Apex Language Server Starts Successfully', async () => {
    utilities.log(`ApexLsp - Set up the testing environment`);
    testSetup = new TestSetupWithWExistingProject(EnvironmentSettings.getInstance().testProjectHome, 'ApexLspPerf', false);

    await testSetup.setUpTestingEnvironment();

    const workbench = await browser.getWorkbench();

    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Show Running Extensions', 1);

    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create Project', 10);

    // Verify Apex extension is present and running
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
      workbench,
      'salesforce.salesforcedx-vscode-apex'
    );
    expect(extensionWasFound).toBe(true);

    const output = await utilities.attemptToFindOutputPanelText(
      'Apex Language Server',
      'ApexIndexer: Scanning user-defined types took',
      20
    );
    const standardApexClasses = output?.match(/ApexIndexer: StandardObjects: [1-9][0-9]{0,5}/g);
    expect(standardApexClasses).toHaveLength(1);
  });

  step('Go to Definition', async () => {
    // utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // // Get open text editor
    // const workbench = await browser.getWorkbench();
    // const editorView = workbench.getEditorView();
    // const textEditor = (await editorView.openEditor(
    //   'ExampleClassTest.cls'
    // )) as TextEditor;
    // await textEditor.moveCursor(6, 20);
    // // Go to definition through F12
    // await browser.keys(['F12']);
    // await utilities.pause(1);
    // // Verify 'Go to definition' took us to the definition file
    // const activeTab = await editorView.getActiveTab();
    // const title = await activeTab?.getTitle();
    // expect(title).toBe('ExampleClass.cls');
  });

  step('Autocompletion', async () => {
    // utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // // Get open text editor
    // const workbench = await browser.getWorkbench();
    // const editorView = workbench.getEditorView();
    // const textEditor = (await editorView.openEditor(
    //   'ExampleClassTest.cls'
    // )) as TextEditor;
    // await textEditor.typeTextAt(7, 1, '\tExampleClass.s');
    // await utilities.pause(1);
    // // Verify autocompletion options are present
    // const autocompletionOptions = await $$(
    //   'textarea.inputarea.monaco-mouse-cursor-text'
    // );
    // expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe(
    //   'true'
    // );
    // expect(
    //   await autocompletionOptions[0].getAttribute('aria-autocomplete')
    // ).toBe('list');
    // // Verify autocompletion options can be selected and therefore automatically inserted into the file
    // await browser.keys(['Enter']);
    // await textEditor.typeText(`'Jack`);
    // await browser.keys(['ArrowRight']);
    // await browser.keys(['ArrowRight']);
    // await textEditor.typeText(';');
    // await textEditor.save();
    // await utilities.pause(1);
    // const line7Text = await textEditor.getTextAtLine(7);
    // expect(line7Text).toContain(`ExampleClass.SayHello('Jack');`);
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
