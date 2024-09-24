/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('LWC LSP', async () => {
  const testSetup = new TestSetup();
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'LwcLsp'
  }

  step('Set up the testing environment', async () => {
    utilities.log('LwcLsp - Set up the testing environment');
    await testSetup.setUp(testReqConfig);

    // Create Lightning Web Component
    await utilities.createLwc('lwc1');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    await utilities.showRunningExtensions();
    await utilities.zoom('Out', 4, utilities.Duration.seconds(1));
    // Verify Lightning Web Components extension is present and running
    const extensionWasFound = await utilities.verifyExtensionsAreRunning(
      utilities.getExtensionsToVerifyActive((ext) => ext.extensionId === 'salesforcedx-vscode-lwc')
    );
    await utilities.zoomReset();
    await expect(extensionWasFound).toBe(true);
  });

  step('Go to Definition (JavaScript)', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition (Javascript)`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    await utilities.getTextEditor(workbench, 'lwc1.js');

    // Move cursor to the middle of "LightningElement"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(['LightningElement']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight', 'ArrowLeft', 'ArrowLeft']);
    await utilities.pause(utilities.Duration.seconds(1));

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify 'Go to definition' took us to the definition file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    await expect(title).toBe('engine.d.ts');
  });

  xstep('Go to Definition (HTML)', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition (HTML)`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    await utilities.getTextEditor(workbench, 'lwc1.html');

    // Move cursor to the middle of "greeting"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(['greeting', 'Escape', 'ArrowRight', 'ArrowLeft', 'ArrowLeft']);
    await utilities.pause(utilities.Duration.seconds(1));

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify 'Go to definition' took us to the definition file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    await expect(title).toBe('lwc1.js');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'lwc1.html');

    // Move cursor to right after the first 'div' tag and type ' lwc'
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(['div', 'Escape', 'ArrowRight']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys([' lwc']);
    await utilities.pause(utilities.Duration.seconds(2));

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    await expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe('true');
    await expect(await autocompletionOptions[0].getAttribute('aria-autocomplete')).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.save();
    await utilities.pause(utilities.Duration.seconds(1));
    const line3Text = await textEditor.getTextAtLine(3);
    await expect(line3Text).toContain('lwc:else');
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup?.tearDown();
  });
});
