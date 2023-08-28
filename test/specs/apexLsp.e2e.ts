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

describe('Apex LSP', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('ApexLsp - Set up the testing environment');
    testSetup = new TestSetup('ApexLsp', false);
    await testSetup.setUp();

    // Create Apex Class
    await utilities.createApexClassWithTest('ExampleClass');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.showRunningExtensions(workbench);

    // Verify Apex extension is present and running
    const extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
      workbench,
      'salesforce.salesforcedx-vscode-apex'
    );
    expect(extensionWasFound).toBe(true);
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    const workbench = await (await browser.getWorkbench()).wait();

    // Get os info
    const os = process.platform;

    // Set right JAVA_HOME path if os is mac
    if (os === 'darwin') {
      // await utilities.runCommandFromCommandPrompt(
      //   workbench,
      //   'Preferences: Open Workspace Settings',
      //   5
      // );
      // await browser.keys(['Salesforcedx-vscode-apex java']);
      // await utilities.pause(1);
      // const javaHomeInput = await $('input.input.setting-control-focus-target');
      // await javaHomeInput.click();
      // await browser.keys(['/Users/runner/hostedtoolcache/Java_Zulu_jdk/11.0.20-8/x64']);
      // await utilities.pause(2);

      await utilities.runCommandFromCommandPrompt(workbench, 'Terminal: Focus Terminal', 5);

      // Set JAVA_HOME with terminal
      await browser.keys([
        'export JAVA_HOME=/Users/runner/hostedtoolcache/Java_Zulu_jdk/11.0.20-8/x64',
        'Enter'
      ]);
      await browser.keys(['echo $JAVA_HOME', 'Enter']);
      await utilities.pause(1);

      utilities.log('Reloading window so setting takes effect');
      // Reload window to update cache and get the setting behavior to work
      await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 60);

      await utilities.runCommandFromCommandPrompt(workbench, 'Terminal: Focus Terminal', 5);
      // Verify JAVA_HOME is ok
      await browser.keys(['echo $JAVA_HOME', 'Enter']);
      await utilities.pause(2);
      expect(true).toBe(false);

      // Close settings view
      await browser.keys([CMD_KEY, 'w']);
    }

    // Get output text from the LSP
    const outputViewText = await utilities.getOutputViewText('Apex Language Server');
    utilities.log('Output view text');
    utilities.log(outputViewText);
    utilities.log('Output view text');

    // Close running extensions view
    await browser.keys([CMD_KEY, 'w']);

    // Get Apex LSP Status Bar
    const statusBar = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      'Editor Language Status'
    );
    await statusBar.click();
    expect(await statusBar.getAttribute('aria-label')).toContain('Indexing complete');
  });

  step('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('ExampleClassTest.cls')) as TextEditor;
    await textEditor.moveCursor(6, 20);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // Verify 'Go to definition' took us to the definition file
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    expect(title).toBe('ExampleClass.cls');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor('ExampleClassTest.cls')) as TextEditor;
    await textEditor.typeTextAt(7, 1, '\tExampleClass.s');
    await utilities.pause(1);

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe('true');
    expect(await autocompletionOptions[0].getAttribute('aria-autocomplete')).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.typeText(`'Jack`);
    await browser.keys(['ArrowRight']);
    await browser.keys(['ArrowRight']);
    await textEditor.typeText(';');
    await textEditor.save();
    await utilities.pause(1);
    const line7Text = await textEditor.getTextAtLine(7);
    expect(line7Text).toContain(`ExampleClass.SayHello('Jack');`);
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
