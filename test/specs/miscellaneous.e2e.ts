/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import * as semver from 'semver';
import { EnvironmentSettings } from '../environmentSettings.ts';

describe('Miscellaneous', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'Miscellaneous'
  }

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
  });

  xstep('Use out-of-the-box Apex Snippets', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use Apex Snippets`);
    const workbench = await utilities.getWorkbench();
    const apexSnippet = 'String.isBlank(inputString)';

    // Create anonymous apex file
    await utilities.createAnonymousApexFile();

    // Type snippet "isb" in a new line and check it inserted the expected string
    const textEditor = await utilities.getTextEditor(workbench, 'Anonymous.apex');
    await utilities.executeQuickPick('Snippets: Insert Snippet', utilities.Duration.seconds(1));
    await browser.keys(['isb']);
    await utilities.pause(utilities.Duration.seconds(2));
    await browser.keys(['Enter']);
    await textEditor.save();
    const fileContent = await textEditor.getText();
    await expect(fileContent).toContain(apexSnippet);
  });

  step('Use Custom Apex Snippets', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use Apex Snippets`);

    // Using the Command palette, run Snippets: Configure Snippets
    const workbench = await utilities.getWorkbench();
    const commandName =
      EnvironmentSettings.getInstance().vscodeVersion === 'stable' ||
        semver.gte(EnvironmentSettings.getInstance().vscodeVersion, '1.92.0')
        ? 'Snippets: Configure Snippets'
        : 'Snippets: Configure User Snippets';

    await utilities.executeQuickPick(commandName, utilities.Duration.seconds(1));
    await browser.keys(['New Global Snippets file...', 'Enter']);
    await utilities.pause(utilities.Duration.seconds(1));
    await browser.keys(['apex.json', 'Enter']);

    const apexSnippet = [
      `{`,
      `"SOQL": {`,
      `"prefix": "soql",`,
      `"body": [`,
      `  "[SELECT \${1:field1, field2} FROM \${2:SobjectName} WHERE \${3:clause}];"`,
      `],`,
      `"description": "Apex SOQL query"`,
      `}`,
      `}`
    ].join('\n');

    // Modify file content
    const textEditor = await utilities.getTextEditor(workbench, 'apex.json.code-snippets');
    await textEditor.setText(apexSnippet);
    await textEditor.save();
    await utilities.executeQuickPick('Developer: Reload Window', utilities.Duration.seconds(50));

    // Create anonymous apex file
    await utilities.createAnonymousApexFile();
    await browser.keys(['Enter']);

    // Type snippet "soql" and check it inserted the expected query
    await browser.keys(['soql']);
    await utilities.pause(utilities.Duration.seconds(2));
    await browser.keys(['Enter']);
    const fileContent = await textEditor.getText();
    await expect(fileContent).toContain('[SELECT field1, field2 FROM SobjectName WHERE clause];');
  });

  step('Use out-of-the-box LWC Snippets - HTML', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use out-of-the-box LWC Snippets - HTML`);
    const workbench = await utilities.getWorkbench();

    const lwcSnippet = [
      '<lightning-button',
      '  variant="base"',
      '  label="Button Label"',
      '  onclick={handleClick}',
      '></lightning-button>'
    ].join('\n');

    // Create simple lwc.html file
    const inputBox = await utilities.executeQuickPick(
      'Create: New File...',
      utilities.Duration.seconds(1)
    );
    await inputBox.setText('lwc.html');
    await browser.keys(['Enter']);
    await browser.keys(['Enter']);

    // Type snippet "lwc-button" and check it inserted the right lwc
    const textEditor = await utilities.getTextEditor(workbench, 'lwc.html');

    await utilities.executeQuickPick('Snippets: Insert Snippet', utilities.Duration.seconds(1));
    await browser.keys(['lwc-button']);
    await utilities.pause(utilities.Duration.seconds(2));
    await browser.keys(['Enter']);
    await browser.keys(['Escape']);
    await textEditor.save();
    const fileContent = await textEditor.getText();

    const fileContentWithoutTrailingSpaces = fileContent
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');

    await expect(fileContentWithoutTrailingSpaces).toContain(lwcSnippet);
  });

  step('Use out-of-the-box LWC Snippets - JS', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use out-of-the-box LWC Snippets - JS`);
    const workbench = await utilities.getWorkbench();

    const lwcSnippet = 'this.dispatchEvent(new CustomEvent("event-name"));';

    // Create simple lwc.js file
    const inputBox = await utilities.executeQuickPick(
      'Create: New File...',
      utilities.Duration.seconds(1)
    );
    await inputBox.setText('lwc.js');
    await browser.keys(['Enter']);
    await browser.keys(['Enter']);

    // Type snippet "lwc", select "lwc-event" and check it inserted the right thing
    const textEditor = await utilities.getTextEditor(workbench, 'lwc.js');
    await browser.keys(['lwc']);
    await utilities.pause(utilities.Duration.seconds(2));
    await browser.keys(['ArrowDown', 'ArrowDown']);
    await browser.keys(['Enter']);
    const fileContent = await textEditor.getText();

    await expect(fileContent).toContain(lwcSnippet);
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup?.tearDown();
  });
});
