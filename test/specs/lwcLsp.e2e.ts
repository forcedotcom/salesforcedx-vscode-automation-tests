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

describe('LWC LSP', async () => {
  let testSetup: TestSetup;
  let projectName: string;

  step('Set up the testing environment', async () => {
    utilities.log(`LwcLsp - Set up the testing environment`);
    testSetup = new TestSetup('LwcLsp', false);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();

    // Create Lightning Web Component
    await utilities.createLWC('lwc1');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Verify Extension is Running`
    );
    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Developer: Show Running Extensions',
      1
    );
    utilities.log(
      `${testSetup.testSuiteSuffixName} - calling utilities.enableLWCExtension()`
    );
    await utilities.enableLWCExtension();

    // Verify Lightning Web Components extension is present and running
    const extensionNameDivs = await $$('div.name');
    let extensionWasFound = false;
    for (const extensionNameDiv of extensionNameDivs) {
      const text = await extensionNameDiv.getText();
      if (text.includes('salesforce.salesforcedx-vscode-lwc')) {
        extensionWasFound = true;
      }
    }
    expect(extensionWasFound).toBe(true);
  });

  step('Go to Definition (Javascript)', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Go to Definition (Javascript)`
    );
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('lwc1.js')) as TextEditor;
    await textEditor.moveCursor(3, 40);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    //Verify 'Go to definition' took us to the definition file
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('engine.d.ts');
  });

  step('Go to Definition (HTML)', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition (HTML)`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('lwc1.html')) as TextEditor;
    await textEditor.moveCursor(3, 57);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    //Verify 'Go to definition' took us to the definition file
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('lwc1.js');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('lwc1.html')) as TextEditor;
    await textEditor.typeTextAt(3, 11, ' lwc');
    await utilities.pause(2);

    // Verify autocompletion options are present
    const autocompletionOptions = await $$(
      'textarea.inputarea.monaco-mouse-cursor-text'
    );
    expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe(
      'true'
    );
    expect(
      await autocompletionOptions[0].getAttribute('aria-autocomplete')
    ).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.save();
    await utilities.pause(1);
    const line3Text = await textEditor.getTextAtLine(3);
    expect(line3Text).toContain('lwc:else');
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
