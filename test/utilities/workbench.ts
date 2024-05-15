import { Workbench } from 'wdio-vscode-service';
import { log } from './miscellaneous.ts';

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
  await workbench.executeCommand('View: Show Explorer');
}
