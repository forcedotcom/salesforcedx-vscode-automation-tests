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

describe('LWC LSP', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('LwcLsp - Set up the testing environment');
    testSetup = new TestSetup('LwcLsp', false);
    await testSetup.setUp();

    // Create Lightning Web Component
    await utilities.createLwc('lwc1');

    // TODO: Try installing ESLint here
    // const workbench = await browser.getWorkbench();
    // await utilities.runCommandFromCommandPrompt(workbench, 'Extensions: Install Extensions', 5);
    // await utilities.pause(1);
    // await browser.keys(["ESLint"]);
    // await utilities.pause(1);
    // await browser.keys(['Tab']);
    // await utilities.pause(1);
    // await browser.keys(['ArrowDown']);
    // await utilities.pause(1);
    // await browser.keys(['Tab']);
    // await utilities.pause(1);
    // await browser.keys(['Enter']);
    // await utilities.pause(1);

    // Install Red Hat XML Extension
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'Extensions: Install Extensions', 5);
    await utilities.pause(1);
    await browser.keys(["Red Hat XML"]);
    await utilities.pause(5);
    await browser.keys(['Tab']);
    await utilities.pause(1);
    await browser.keys(['ArrowDown']);
    await utilities.pause(1);
    await browser.keys(['Tab']);
    await utilities.pause(1);
    await browser.keys(['Enter']);
    await utilities.pause(1);
  });

  step('Verify Extension is Running', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Verify Extension is Running`
    );

    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await browser.getWorkbench();
    await utilities.showRunningExtensions(workbench);

    // Zoom out so more extensions are visible
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Zoom Out', 2);

    // Reload window so that the LWC extension's functionality will work in later steps
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 5);

    // Wait for a minute so that the LWC extension is activated.
    await utilities.pause(60);

    // Verify Lightning Web Components extension is present and running
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(workbench, 'salesforce.salesforcedx-vscode-lwc');
    expect(extensionWasFound).toBe(true);

    const redHatXmlWasFound = await utilities.findExtensionInRunningExtensionsListNoClosePanel(workbench, 'XML');
    expect(redHatXmlWasFound).toBe(true);

    // The ESLint extension is disabled - click the 'Reload and Enable Extensions' button
    // let buttons = await $$('a.monaco-button.monaco-text-button');
    // utilities.log('number of buttons = ' + buttons.length);
    // for (const item of buttons) {
    //   const text = await item.getText();
    //   utilities.log('text of current button = ' + text);
    //   if (text.includes('Reload and Enable Extensions')) {
    //     utilities.log('"Reload and Enable Extensions" clicked');
    //     await item.click();
    //   }
    // }
    // await utilities.pause(60);

    // Disable and re-enable all running extensions
    // await utilities.runCommandFromCommandPrompt(workbench, 'Extensions: Disable All Installed Extensions', 5);
    // await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 60);
    // await utilities.runCommandFromCommandPrompt(workbench, 'Extensions: Enable All Extensions', 5);
    // await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 60);

    // Verify Lightning Web Components extension is present and running
    // const extensionWasFound2 = await utilities.findExtensionInRunningExtensionsList(workbench, 'salesforce.salesforcedx-vscode-lwc');
    // expect(extensionWasFound2).toBe(true);

    // const eslintWasFound = await utilities.findExtensionInRunningExtensionsListNoClosePanel(workbench, 'ESLint');
    // expect(eslintWasFound).toBe(true);

    // Make sure Lightning LSP is activated
    await utilities.openOutputView();
    let lwcMessage = await utilities.getOutputViewText('LWC Extension');
    utilities.log(lwcMessage);

    // Trigger an error to check the screenshot and see what is in the 'LWC Extension' tab of the output panel
    // let x = 0;
    // expect(x).toBe(1);

  });

  step('Go to Definition (JavaScript)', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Go to Definition (Javascript)`
    );
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    await editorView.openEditor('lwc1.js') as TextEditor;

    // Move cursor to the middle of "LightningElement"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(2);
    await browser.keys(["extends Light"]);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await utilities.pause(1);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // Verify 'Go to definition' took us to the definition file
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('engine.d.ts');
  });

  step('Go to Definition (HTML)', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition (HTML)`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    await editorView.openEditor('lwc1.html') as TextEditor;

    // Move cursor to the middle of "greeting"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys(["greet"]);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await utilities.pause(1);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // Verify 'Go to definition' took us to the definition file
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

    // Move cursor to the end of "div"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys(["<div"]);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await utilities.pause(1);

    await textEditor.typeText(' lwc');
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
