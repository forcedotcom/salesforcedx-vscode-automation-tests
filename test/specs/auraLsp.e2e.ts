/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
// import { CMD_KEY } from 'wdio-vscode-service/dist/constants.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

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

    // Verify Aura Components extension is present and running.
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
      workbench,
      'salesforcedx-vscode-lightning'
    );
    expect(extensionWasFound).toBe(true);
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get output text from the LSP
    const outputViewText = await utilities.getOutputViewText('Aura Language Server');
    expect(outputViewText).toContain('language server started');
    utilities.log('Output view text');
    utilities.log(outputViewText);
  });

  xstep('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const textEditor = await utilities.getTextEditor(workbench, 'aura1.cmp');

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

  xstep('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const textEditor = await utilities.getTextEditor(workbench, 'aura1.cmp');
    await textEditor.typeTextAt(2, 1, '<aura:appl');
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
