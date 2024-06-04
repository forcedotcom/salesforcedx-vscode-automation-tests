import { Workbench } from 'wdio-vscode-service';
import { log } from './miscellaneous.ts';
import { runCommandFromCommandPrompt } from './commandPrompt.ts';

export async function getWorkbench(wait = 5): Promise<Workbench> {
  return await (await browser.getWorkbench()).wait(wait * 1000);
}

export async function reloadWindow(): Promise<void> {
  log(`Reloading window`);
  const workbench = await getWorkbench();
  await workbench.executeCommand('Developer: Reload Window');
}

export async function showExplorerView(): Promise<void> {
  log('Show Explorer');
  const workbench = await getWorkbench();
  const prompt = await runCommandFromCommandPrompt(workbench, 'View: Show Explorer', 5);
  await prompt.confirm();
}
