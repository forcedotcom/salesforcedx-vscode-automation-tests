/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step, xstep } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';

import { Key } from 'webdriverio';
import { Duration } from '@salesforce/kit';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

describe('SOQL', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'SOQL'
  };

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
  });

  step('SFDX: Create Query in SOQL Builder', async () => {
    utilities.log(`${testSetup.testSuiteSuffixName} - SFDX: Create Query in SOQL Builder`);

    // Run SFDX: Create Query in SOQL Builder
    await utilities.executeQuickPick(
      'SFDX: Create Query in SOQL Builder',
      utilities.Duration.seconds(3)
    );

    // Verify the command took us to the soql builder
    const workbench = await utilities.getWorkbench();
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    await expect(title).toBe('untitled.soql');
  });

  step('Switch Between SOQL Builder and Text Editor - from SOQL Builder', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Switch Between SOQL Builder and Text Editor - from SOQL Builder`
    );

    // Click Switch Between SOQL Builder and Text Editor
    const toggleSOQLButton = await utilities.findElementByText(
      'a',
      'aria-label',
      'Switch Between SOQL Builder and Text Editor'
    );
    await expect(toggleSOQLButton).toBeDefined();
    await toggleSOQLButton.click();

    // Verify 'Switch Between SOQL Builder and Text Editor' took us to the soql builder
    const workbench = await utilities.getWorkbench();
    const editorView = workbench.getEditorView();
    const activeTab = await editorView.getActiveTab();
    const title = await activeTab?.getTitle();
    await expect(title).toBe('untitled.soql');
    const openTabs = await editorView.getOpenEditorTitles();
    await expect(openTabs.length).toBe(3);
    await expect(openTabs[1]).toBe('untitled.soql');
    await expect(openTabs[2]).toBe('untitled.soql');
  });

  step('Switch Between SOQL Builder and Text Editor - from file', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Switch Between SOQL Builder and Text Editor - from file`
    );

    // Click Switch Between SOQL Builder and Text Editor
    const toggleSOQLButton = await utilities.findElementByText(
      'a',
      'aria-label',
      'Switch Between SOQL Builder and Text Editor'
    );
    await expect(toggleSOQLButton).toBeDefined();
    await toggleSOQLButton.click();
    await utilities.pause(utilities.Duration.seconds(2));
    await browser.keys([CMD_KEY, 'Shift', 'p']);
  });

  xstep('Verify the contents of the SOQL Builder', async () => {
    //TODO
  });

  xstep('Create query in SOQL Builder', async () => {
    //TODO
  });

  xstep('Verify the contents of the soql file', async () => {
    const expectedText = ['SELECT COUNT()', 'from Account'].join('\n');
    const workbench = await utilities.getWorkbench();
    const textEditor = await utilities.getTextEditor(workbench, 'countAccounts.soql');
    const textGeneratedFromTemplate = (await textEditor.getText()).trimEnd().replace(/\r\n/g, '\n');
    await expect(textGeneratedFromTemplate).toEqual(expectedText);
  });

  after('Tear down and clean up the testing environment', async () => {
    utilities.log(
      `${testSetup.testSuiteSuffixName} - Tear down and clean up the testing environment`
    );
    await testSetup?.tearDown();
  });
});
