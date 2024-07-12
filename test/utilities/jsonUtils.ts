import { getTextEditor, pause } from './miscellaneous';

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