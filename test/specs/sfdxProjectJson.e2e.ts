/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup.ts';
import * as utilities from '../utilities/index.ts';
import path from 'path';
import { TextEditor } from 'wdio-vscode-service';


describe('Customize sfdx-project.json', async () => {
  let testSetup: TestSetup;
  const testReqConfig: utilities.TestReqConfig = {
    projectConfig: {
      projectShape: utilities.ProjectShapeOption.NEW,
    },
    isOrgRequired: false,
    testSuiteSuffixName: 'sfdxProjectJson'
  }

  step('Set up the testing environment', async () => {
    testSetup = await TestSetup.setUp(testReqConfig);
    await createSfdxProjectJsonWithAllFields(testSetup);
    await utilities.reloadAndEnableExtensions();
  });

  step('Verify our extensions are loaded after updating sfdx-project.json', async () => {
    await expect(
      await utilities.verifyExtensionsAreRunning(utilities.getExtensionsToVerifyActive())
    ).toBe(true);
  });

  after('Tear down and clean up the testing environment', async () => {
    await testSetup?.tearDown();
  });
});

async function createSfdxProjectJsonWithAllFields(testSetup: TestSetup): Promise<void> {
  const workbench = await (await browser.getWorkbench()).wait();
  const sfdxConfig = [
    `{`,
    `\t"packageDirectories": [`,
    `\t\t{`,
    `\t\t\t"path": "force-app",`,
    `\t\t\t"default": true`,
    `\t\t}`,
    `\t],`,
    `\t"namespace": "",`,
    `\t"sourceApiVersion": "61.0",`,
    `\t"sourceBehaviorOptions": ["decomposeCustomLabelsBeta", "decomposePermissionSetBeta", "decomposeWorkflowBeta", "decomposeSharingRulesBeta"]`,
    `}`
  ].join('\n');
  await utilities.openFile(path.join(testSetup.projectFolderPath!, 'sfdx-project.json'));
  const editorView = workbench.getEditorView();
  const textEditor = (await editorView.openEditor('sfdx-project.json')) as TextEditor;
  await textEditor.setText(sfdxConfig);
  await textEditor.save();
  await utilities.pause();
}