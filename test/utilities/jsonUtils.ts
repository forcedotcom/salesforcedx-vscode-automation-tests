/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { pause } from './miscellaneous.ts';
import { getTextEditor } from './textEditorView.ts';

export async function createSfdxProjectJsonWithAllFields(): Promise<void> {
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
  const textEditor = await getTextEditor(workbench, 'sfdx-project.json');
  await textEditor.setText(sfdxConfig);
  await textEditor.save();
  await pause();
}