/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { log } from './miscellaneous';

export async function getStatusBarItemWhichIncludes(
  workbench: Workbench,
  title: string
): Promise<WebdriverIO.Element> {
  const retries = 10;
  const interval = 1_000; // 1 second interval

  const statusBarItem = await browser.waitUntil(
    async () => {
      const statusBar = await workbench.getStatusBar().wait();
      const items = await statusBar.item$$;
      let itemWithTitle = null;
      for (const item of items) {
        const text = await item.getTitle();
        log(`status bar item: ${text}`);
        if (text.includes(title)) {
          itemWithTitle = item;
          break;
        }
      }
      return itemWithTitle;

    },
    {
      timeout: retries * interval,
      interval: interval,
      timeoutMsg: `Status bar item containing ${title} was not found`
    }
  );

  if (!statusBarItem) {
    throw new Error(`Status bar item containing ${title} was not found`);
  }

  return statusBarItem;
}
