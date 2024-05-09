/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';

describe('Miscellaneous', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('Miscellaneous', false);
    await testSetup.setUp();
  });

  step('Use out-of-the-box Apex Snippets', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use Apex Snippets`);
    const workbench = await (await browser.getWorkbench()).wait();
    const apexSnippet = 'String.isBlank(inputString)';

    // Create anonymous apex file
    await utilities.createAnonymousApexFile();

    // Type snippet "isb" in a new line and check it inserted the expected string
    const textEditor = await utilities.getTextEditor(workbench, 'Anonymous.apex');
    await browser.keys([CMD_KEY, 'f']);
    await utilities.pause(1);
    await browser.keys([`System.debug('¡Hola mundo!');`]);
    await browser.keys(['Escape']);
    await browser.keys(['ArrowRight', 'Enter']);
    await browser.keys(['isb']);
    await utilities.pause(2);
    await browser.keys(['Enter']);
    await textEditor.save();
    const fileContent = await textEditor.getText();
    expect(fileContent).toContain(apexSnippet);
  });

  step('Use out-of-the-box LWC Snippets - HTML', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use out-of-the-box LWC Snippets - HTML`);
    const workbench = await (await browser.getWorkbench()).wait();

    const lwcSnippet = [
      '<lightning-button',
      '  variant="base"',
      '  label="Button Label"',
      '  onclick={handleClick}',
      '></lightning-button>'
    ].join('\n');

    // Create simple lwc.html file
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'Create: New File...',
      1
    );
    await inputBox.setText('lwc.html');
    await browser.keys(['Enter']);
    await browser.keys(['Enter']);

    // Type snippet "lwc-button" and check it inserted the right lwc
    const textEditor = await utilities.getTextEditor(workbench, 'lwc.html');
    await browser.keys(['lwc-button']);
    await utilities.pause(2);
    await browser.keys(['ArrowDown']);
    await browser.keys(['Enter']);
    const fileContent = await textEditor.getText();

    const fileContentWithoutTrailingSpaces = fileContent
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');

    expect(fileContentWithoutTrailingSpaces).toContain(lwcSnippet);
  });

  step('Use out-of-the-box LWC Snippets - JS', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use out-of-the-box LWC Snippets - JS`);
    const workbench = await (await browser.getWorkbench()).wait();

    const lwcSnippet = 'this.dispatchEvent(new CustomEvent("event-name"));';

    // Create simple lwc.js file
    const inputBox = await utilities.runCommandFromCommandPrompt(
      workbench,
      'Create: New File...',
      1
    );
    await inputBox.setText('lwc.js');
    await browser.keys(['Enter']);
    await browser.keys(['Enter']);

    // Type snippet "lwc", select "lwc-event" and check it inserted the right thing
    const textEditor = await utilities.getTextEditor(workbench, 'lwc.js');
    await browser.keys(['lwc']);
    await utilities.pause(2);
    await browser.keys(['ArrowDown', 'ArrowDown']);
    await browser.keys(['Enter']);
    const fileContent = await textEditor.getText();

    expect(fileContent).toContain(lwcSnippet);
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
