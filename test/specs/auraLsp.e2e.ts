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
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';

describe('Aura LSP', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('AuraLsp - Set up the testing environment');
    testSetup = new TestSetup('AuraLsp', false);
    await testSetup.setUp();

    // Create Aura Component
    await utilities.createAura('aura1');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.showRunningExtensions(workbench);
    // await utilities.enableLwcExtension();

    // Verify Aura Components extension is present and running.
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
      workbench,
      'salesforcedx-vscode-lightning'
    );
    expect(extensionWasFound).toBe(true);
  });

  step('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('aura1.cmp');
    await inputBox.confirm();
    await utilities.pause(1);
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('aura1.cmp')) as TextEditor;

    // Move cursor to the middle of "simpleNewContact"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys(['!v.sim']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await utilities.pause(1);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // Verify 'Go to definition'
    const definition = await textEditor.getCoordinates();
    expect(definition[0]).toBe(3);
    expect(definition[1]).toBe(27);
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
    await inputBox.setText('aura1.cmp');
    await inputBox.confirm();
    await utilities.pause(1);
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('aura1.cmp')) as TextEditor;
    await textEditor.typeTextAt(2, 1, '<aura');
    await utilities.pause(1);

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe('true');
    expect(await autocompletionOptions[0].getAttribute('aria-autocomplete')).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.typeText('>');
    await textEditor.save();
    await utilities.pause(1);
    const line3Text = await textEditor.getTextAtLine(2);
    expect(line3Text).toContain('aura:application');
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
