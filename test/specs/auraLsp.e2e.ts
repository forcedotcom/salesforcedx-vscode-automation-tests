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

describe('Aura LSP', async () => {
  let testSetup: TestSetup;
  let projectName: string;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('AuraLsp', false);
    await testSetup.setUp();
    projectName = testSetup.tempProjectName.toUpperCase();

    // Create Aura Component
    await utilities.createAura('aura1');
  });

  step('Verify Extension is Running', async () => {
    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Developer: Show Running Extensions',
      1
    );
    let buttons = await $$('a.monaco-button.monaco-text-button');
    for (const item of buttons) {
      const text = await item.getText();
      if (text.includes('Install and Reload')) {
        await item.click();
      }
    }
    await utilities.pause(10);
    buttons = await $$('a.monaco-button.monaco-text-button');
    for (const item of buttons) {
      const text = await item.getText();
      if (text.includes('Reload and Enable Extensions')) {
        await item.click();
      }
    }
    await utilities.pause(5);
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'Developer: Reload Window',
      10
    );

    // Verify Aura Components extension is present and running
    const extensionNameDivs = await $$('div.name');
    let extensionWasFound = false;
    for (const extensionNameDiv of extensionNameDivs) {
      const text = await extensionNameDiv.getText();
      if (text.includes('salesforce.salesforcedx-vscode-lightning')) {
        extensionWasFound = true;
      }
    }
    expect(extensionWasFound).toBe(true);
  });

  step('Go to Definition', async () => {
    debugger;
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('aura1.cmp')) as TextEditor;
    await textEditor.moveCursor(8, 10);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    //Verify 'Go to definition'
    const definition = await textEditor.getCoordinates();
    expect(definition[0]).toBe(3);
    expect(definition[1]).toBe(24);
  });

  step('Autocompletion', async () => {
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('aura1.cmp')) as TextEditor;
    await textEditor.typeTextAt(2, 1, '<aura');
    await utilities.pause(1);

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
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
