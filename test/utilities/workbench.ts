import { Workbench } from 'wdio-vscode-service';
import { Duration, isDuration, log, pause } from './miscellaneous.ts';
import { executeQuickPick } from './commandPrompt.ts';
import { PredicateWithTimeout } from './predicates.ts';

export async function getWorkbench(wait = 5): Promise<Workbench> {
  return await (await browser.getWorkbench()).wait(wait * 1_000);
}
// { predicate: standardPredicates.alwaysTrue, maxWaitTime: 5_000 }
export async function reloadWindow(
  predicateOrWait: PredicateWithTimeout | Duration = Duration.milliseconds(0)
): Promise<void> {
  log(`Reloading window`);
  const prompt = await executeQuickPick('Developer: Reload Window');
  await handlePredicateOrWait(predicateOrWait, prompt);
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
  wait: Duration = Duration.seconds(1)
): Promise<void> {
  await zoomReset(wait);
  for (let level = 0; level < zoomLevel; level++) {
    await executeQuickPick(`View: Zoom ${zoomIn}`, wait);
  }
}

export async function zoomReset(wait: Duration = Duration.seconds(1)): Promise<void> {
  await executeQuickPick('View: Reset Zoom', wait);
}

async function handlePredicateOrWait(
  predicateOrWait: PredicateWithTimeout | Duration,
  prompt: unknown
) {
  log('handlePredicateOrWait');
  if (isDuration(predicateOrWait)) {
    if (predicateOrWait.milliseconds > 0) {
      await pause(predicateOrWait);
    }
  } else {
    const { predicate, maxWaitTime } = predicateOrWait;
    const safePredicate = withFailsafe(predicate, maxWaitTime, prompt);

    try {
      const result = await safePredicate();
      if (result !== true) {
        throw new Error('Predicate did not resolve to true');
      }
    } catch (error) {
      log(`Predicate failed or timed out: ${(error as Error).message}`);
      throw error;
    }
  }
}

function withFailsafe(
  predicate: (...args: unknown[]) => Promise<boolean>,
  timeout: Duration,
  prompt: unknown
): () => Promise<boolean> {
  return async function () {
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Predicate timed out')), timeout.milliseconds)
    );

    return Promise.race([predicate(prompt), timeoutPromise]);
  };
}
