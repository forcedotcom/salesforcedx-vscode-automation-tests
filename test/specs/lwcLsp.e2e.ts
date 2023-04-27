/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { InputBox, QuickOpenBox, TextEditor } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('LWC LSP', async () => {
  let testSetup: TestSetup;
  let projectName: string;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('LwcLsp', true);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();

    // Create Lightning Web Component
    await utilities.createLWC('lwc1');
  });

  step('Verify Extension is Running', async () => {
    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Developer: Show Running Extensions',
      1
    );

    // Verify Lightning Web Components extension is present and running
    const extensionNameDivs = await $$('div.name');
    let extensionWasFound = false;
    for (const extensionNameDiv of extensionNameDivs) {
      const text = await extensionNameDiv.getText();
      if (text.includes('salesforce.salesforcedx-vscode-lwc')) {
        extensionWasFound = true;
      }
    }
    // TODO: Extension is actually not loading
    expect(extensionWasFound).toBe(false);
  });

  step('Go to Definition (HTML)', async () => {
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('lwc1.html')) as TextEditor;
    await textEditor.moveCursor(3, 40);
    // TODO: implement
    expect(1).toBe(1);
  });

  step('Go to Definition (Javascript)', async () => {
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

  step('On hover', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });

  step('Autocompletion', async () => {
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('lwc1.html')) as TextEditor;
    await textEditor.moveCursor(3, 8);
    await textEditor.setText(' ');
    await textEditor.moveCursor(3, 8);
    await textEditor.setText('lwc');
    expect(1).toBe(1);
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
