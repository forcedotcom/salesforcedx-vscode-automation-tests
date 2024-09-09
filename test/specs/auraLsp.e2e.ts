/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { RefactoredTestSetup } from '../RefactoredTestSetup.ts';
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('Aura LSP', async () => {
  const testSetup = new RefactoredTestSetup();

  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'auraLsp'
  }

  step('Set up the testing environment', async () => {
    utilities.log('AuraLsp - Set up the testing environment');
    await testSetup.setUp(testReqConfig);

    // Create Aura Component
    await utilities.createAura('aura1');

    // Reload the VSCode window to allow the Aura Component to be indexed by the Aura Language Server
    await utilities.reloadWindow(utilities.Duration.seconds(70));
  });

  step('Verify Extension is Running', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify Extension is Running`);

    // Using the Command palette, run Developer: Show Running Extensions
    await utilities.showRunningExtensions();
    await utilities.zoom('Out', 4, utilities.Duration.seconds(1));

    // Verify Aura Components extension is present and running.
    const extensionWasFound = await utilities.verifyExtensionsAreRunning(
      utilities.getExtensionsToVerifyActive(
        (ext) => ext.extensionId === 'salesforcedx-vscode-lightning'
      )
    );
    await utilities.zoomReset();
    await expect(extensionWasFound).toBe(true);
  });

  step('Verify LSP finished indexing', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Verify LSP finished indexing`);

    // Get output text from the LSP
    const outputViewText = await utilities.getOutputViewText('Aura Language Server');
    await expect(outputViewText).toContain('language server started');
    utilities.log('Output view text');
    utilities.log(outputViewText);
  });

  step('Go to Definition', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Go to Definition`);
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'aura1.cmp');

    // Move cursor to the middle of "simpleNewContact"
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(['!v.sim']);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await utilities.pause(utilities.Duration.seconds(1));

    // Go to definition through F12
    await browser.keys(['F12']);
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify 'Go to definition'
    // This workaround types text in the place where the cursor is located after the Go to Definition is complete, and then verifies that the added text is present in the correct location.
    await browser.keys('elephant');
    await browser.keys([CMD_KEY, 's']);
    await utilities.pause(utilities.Duration.seconds(1));
    const line3Text = await textEditor.getTextAtLine(3);
    await expect(line3Text).toContain('name="elephantsimpleNewContact"');

    // The following code uses WDIO's provided function to get the position of the cursor, but `textEditor.getCoordinates();` causes a `coordinates is not iterable` error in Ubuntu. Thus we have to use the workaround above instead.
    // const definition = await textEditor.getCoordinates();
    // await expect(definition[0]).toBe(3);
    // await expect(definition[1]).toBe(27);
  });

  step('Autocompletion', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Autocompletion`);
    // Get open text editor
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'aura1.cmp');
    // Workaround for `coordinates is not iterable` error is needed here too because `textEditor.typeTextAt()` uses coordinates.
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys('aura:attribute');
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight']);
    await browser.keys(['ArrowUp']);
    await browser.keys('<aura:appl');
    // await textEditor.typeTextAt(2, 1, '<aura:appl');
    await utilities.pause(utilities.Duration.seconds(1));

    // Verify autocompletion options are present
    const autocompletionOptions = await $$('textarea.inputarea.monaco-mouse-cursor-text');
    await expect(await autocompletionOptions[0].getAttribute('aria-haspopup')).toBe('true');
    await expect(await autocompletionOptions[0].getAttribute('aria-autocomplete')).toBe('list');

    // Verify autocompletion options can be selected and therefore automatically inserted into the file
    await browser.keys(['Enter']);
    await textEditor.typeText('>');
    await textEditor.save();
    await utilities.pause(utilities.Duration.seconds(1));
    const line3Text = await textEditor.getTextAtLine(2);
    await expect(line3Text).toContain('aura:application');
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup?.tearDown();
  });
});
