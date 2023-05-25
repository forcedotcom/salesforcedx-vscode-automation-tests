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

describe('Visualforce LSP', async () => {
  let testSetup: TestSetup;
  const fiveMinutes = 5 * 60;

  step('Set up the testing environment', async () => {
    utilities.log('VisualforceLsp - Set up the testing environment');
    testSetup = new TestSetup('VisualforceLsp', false);
    await testSetup.setUp();

    // Create Visualforce Page
    await utilities.createVisualforcePage();

    // Push source to org
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts',
      1
    );
    // Wait for the command to execute
    await utilities.waitForNotificationToGoAway(
      workbench,
      'Running SFDX: Push Source to Default Org and Override Conflicts',
      fiveMinutes
    );
    const successPushNotificationWasFound = await utilities.notificationIsPresent(
      workbench,
      'SFDX: Push Source to Default Org and Override Conflicts successfully ran'
    );
    expect(successPushNotificationWasFound).toBe(true);
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

    // Close panel so the visualforce extension can be seen
    await utilities.runCommandFromCommandPrompt(
      workbench,
      'View: Close Panel',
      1
    );

    // Verify Visualforce extension is present and running
    const extensionNameDivs = await $$('div.name');
    let extensionWasFound = false;
    for (const extensionNameDiv of extensionNameDivs) {
      const text = await extensionNameDiv.getText();
      if (text.includes('salesforce.salesforcedx-vscode-visualforce')) {
        extensionWasFound = true;
      }
    }
    expect(extensionWasFound).toBe(true);
  });

  step('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor(
      'FooPage.page'
    )) as TextEditor;
    await textEditor.moveCursor(1, 25);

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(1);

    // TODO: go to definition is actually not working

    // // Verify 'Go to definition' took us to the definition file
    // const activeTab = await editorView.getActiveTab();
    // const title = await activeTab?.getTitle();
    // expect(title).toBe('MyController.cls');
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await browser.getWorkbench();
    const editorView = workbench.getEditorView();
    const textEditor = (await editorView.openEditor(
      'FooPage.page'
    )) as TextEditor;
    await textEditor.typeTextAt(3, 1, '\t\t<apex:pageM');
    await utilities.pause(1);

    // Verify autocompletion options are present
    const autocompletionOptions = await $$(
      'textarea.inputarea.monaco-mouse-cursor-text'
    );
    const ariaHasPopupAttribute = await autocompletionOptions[0].getAttribute(
      'aria-haspopup'
    );
    expect(ariaHasPopupAttribute).toBe('true');

    const ariaAutocompleteAttribute = await autocompletionOptions[0].getAttribute(
      'aria-autocomplete'
    );
    expect(ariaAutocompleteAttribute).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.typeText('/>');
    await textEditor.save();
    await utilities.pause(1);
    const line3Text = await textEditor.getTextAtLine(3);
    expect(line3Text).toContain('apex:pageMessage');
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
