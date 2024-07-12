/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import { EnvironmentSettings } from '../environmentSettings.ts';

import { Key } from 'webdriverio';
import { Duration } from '@salesforce/kit';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('Apex LSP', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    utilities.log('ApexLsp - Set up the testing environment');
    utilities.log(`ApexLsp - JAVA_HOME: ${EnvironmentSettings.getInstance().javaHome}`);
    testSetup = new TestSetup('ApexLsp', false);
    await testSetup.setUp();

    // Create Apex Class
    await utilities.createApexClassWithTest('ExampleClass');
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    await utilities.showRunningExtensions();
    await utilities.zoom('Out', 4, Duration.seconds(1));
    // Verify Apex extension is present and running
    const foundExtensions = await utilities.verifyExtensionsAreRunning(
      utilities.getExtensionsToVerifyActive((ext) => ext.extensionId === 'salesforcedx-vscode-apex')
    );
    await utilities.zoomReset();
    await expect(foundExtensions).toBe(true);
    // Close running extensions view
    await browser.keys([CMD_KEY, 'w']);
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get Apex LSP Status Bar
    const workbench = await utilities.getWorkbench();
    const statusBar = await utilities.getStatusBarItemWhichIncludes(
      workbench,
      'Editor Language Status'
    );
    await statusBar.click();
    await expect(await statusBar.getAttribute('aria-label')).toContain('Indexing complete');

    // Get output text from the LSP
    const outputViewText = await utilities.getOutputViewText('Apex Language Server');
    utilities.log('Output view text');
    utilities.log(outputViewText);
  });

  step('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    await utilities.getTextEditor(workbench, 'ExampleClassTest.cls');

    // Move cursor to the middle of "ExampleClass.SayHello() call"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(['.SayHello']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await browser.keys(['ArrowLeft']);
    await browser.keys(['ArrowLeft']);
    await utilities.pause(Duration.seconds(1));

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(Duration.seconds(1));

    // Verify 'Go to definition' took us to the definition file
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    await expect(title).toBe('ExampleClass.cls');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await (await browser.getWorkbench()).wait();
    const textEditor = await utilities.getTextEditor(workbench, 'ExampleClassTest.cls');

    // Move cursor to line 7 and type ExampleClass.s
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(Duration.seconds(1));
    await browser.keys(['System.debug']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowLeft']);
    await browser.keys(['ArrowDown']);
    await browser.keys(['ArrowDown']);
    await browser.keys('ExampleClass.say');
    await utilities.pause(Duration.seconds(1));

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    await expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe('true');
    await expect(await autocompletionOptions[0].getAttribute('aria-autocomplete')).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.typeText(`'Jack`);
    await browser.keys(['ArrowRight']);
    await browser.keys(['ArrowRight']);
    await textEditor.typeText(';');
    await textEditor.save();
    await utilities.pause(Duration.seconds(1));
    const line7Text = await textEditor.getTextAtLine(7);
    await expect(line7Text).toContain(`ExampleClass.SayHello('Jack');`);
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
