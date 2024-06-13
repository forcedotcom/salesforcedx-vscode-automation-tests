import { Workbench } from 'wdio-vscode-service';
import { log } from './miscellaneous.ts';
import { executeQuickPick } from './commandPrompt.ts';

export async function getWorkbench(wait = 5): Promise<Workbench> {
  return await (await browser.getWorkbench()).wait(wait * 1000);
}

export async function reloadWindow(): Promise<void> {
  log(`Reloading window`);
  await executeQuickPick('Developer: Reload Window');
}

export async function enableAllExtensions(): Promise<void> {
  log(`Enabling all extensions`);
  await executeQuickPick('Extensions: Enable All Extensions');
}

export async function showExplorerView(): Promise<void> {
  log('Show Explorer');
  await executeQuickPick('View: Show Explorer');

  // XPath expression for the Explorer view
  const explorerViewXPath = "//div[contains(@class, 'composite title')]//h2[text()='Explorer']";

  await browser.waitUntil(
    async () => {
      const explorerView = await $(explorerViewXPath);
      return await explorerView.isDisplayed();
    },
    {
      timeout: 5000, // Timeout after 5 seconds
      interval: 500, // Check every 500 ms
      timeoutMsg: 'Expected Explorer view to be visible after 5 seconds'
    }
  );
}

export async function zoom(
  zoomIn: 'In' | 'Out',
  zoomLevel: number,
  wait: number = 1
): Promise<void> {
  for (let level = 0; level < zoomLevel; level++) {
    await executeQuickPick(`View: Zoom ${zoomIn}`, wait);
  }
}

export async function zoomReset(wait: number = 1): Promise<void> {
  await executeQuickPick('View: Reset Zoom', wait);
}
