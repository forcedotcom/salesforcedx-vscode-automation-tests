/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

describe('Miscellaneous', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('Miscellaneous', false);
    await testSetup.setUp();
  });
  step('Use out-of-the-box Apex Snippets', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - Use out-of-the-box Apex Snippets`);

    // Using the Command palette, run Snippets: Configure User Snippets
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'Snippets: Configure User Snippets', 1);
    await browser.keys(['New Global Snippets file...', 'Enter']);
    await utilities.pause(1);
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
    expect(1).toBe(2);

    // Create anonymous apex file
    await utilities.createAnonymousApexFile();
    await browser.keys(['Enter']);

    // Type snippet "soql" and check it inserted the expected query
    await browser.keys(['soql', 'Enter']);
    const fileContent = await textEditor.getText();
    expect(fileContent).toContain('[SELECT field1, field2 FROM SobjectName WHERE clause];');
  });

  step('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup.tearDown();
  });
});
