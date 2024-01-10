/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';

describe('LWC LSP', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('LwcLsp - Set up the testing environment');
    testSetup = new TestSetup('LwcLsp', false);
    await testSetup.setUp();

    // Create Lightning Web Component
    await utilities.createLwc('lwc1');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await browser.getWorkbench();
    await utilities.showRunningExtensions(workbench);

    // Verify Lightning Web Components extension is present and running
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
      workbench,
      'salesforcedx-vscode-lwc'
    );
    expect(extensionWasFound).toBe(true);
  });

  step('Go to Definition (JavaScript)', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition (Javascript)`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    await utilities.getTextEditor(workbench, 'lwc1.js');

    // Move cursor to the middle of "LightningElement"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys(['LightningElement']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight', 'ArrowLeft', 'ArrowLeft']);
    await utilities.pause(1);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // Verify 'Go to definition' took us to the definition file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('engine.d.ts');
  });

  xstep('Go to Definition (HTML)', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition (HTML)`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    await utilities.getTextEditor(workbench, 'lwc1.html');

    // Move cursor to the middle of "greeting"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys(['greeting']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight', 'ArrowLeft', 'ArrowLeft']);
    await utilities.pause(1);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // Verify 'Go to definition' took us to the definition file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('lwc1.js');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc1.html');

    // Move cursor to an empty space and type "lwc"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys(['div']);
    await browser.keys(['Enter']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await utilities.pause(1);
    await browser.keys([' lwc']);
    await utilities.pause(2);

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe('true');
    expect(await autocompletionOptions[0].getAttribute('aria-autocomplete')).toBe('list');

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
