/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { pause } from './miscellaneous.ts';
import { Duration } from '@salesforce/kit';

export async function getStatusBarItemWhichIncludes(
  workbench: Workbench,
  title: string
): Promise<WebdriverIO.Element> {
  const retries = 10;
  for (let i = retries; i > 0; i--) {
    const statusBar = await workbench.getStatusBar().wait();
    const items = await statusBar.item$$;
    for (const item of items) {
      const itemTitle = await item.getAttribute(statusBar.locators.itemTitle);
      if (itemTitle.includes(title)) {
        return item;
      }
    }

    await pause(Duration.seconds(1));
  }

  throw new Error(`Status bar item containing ${title} was not found`);
}
