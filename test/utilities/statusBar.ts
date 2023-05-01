/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  StatusBar,
} from 'wdio-vscode-service';
import {
  log,
  pause
} from './miscellaneous';

export async function getStatusBarItemWhichIncludes(statusBar: StatusBar, title: string): Promise<WebdriverIO.Element> {
  await pause(1);

  const items = await statusBar.item$$;
  for (const item of items) {
    const itemTitle = await item.getAttribute(statusBar.locators.itemTitle);
    if (itemTitle.includes(title)) {
        return item;
    }
  }

  // TODOx:... oh-oh!
  log(`getStatusBarItemWhichIncludes() didn't find a match... logging all items found...`);
  for (const item of items) {
    const itemTitle = await item.getAttribute(statusBar.locators.itemTitle);
    log('Status bar item: ' + itemTitle);
  }

  log('one more time...');
  await pause(10);

  const items2 = await statusBar.item$$;
  for (const item of items2) {
    const itemTitle = await item.getAttribute(statusBar.locators.itemTitle);
    log('Status bar item: ' + itemTitle);

    if (itemTitle.includes(title)) {
      log(`Success!  The second time around, '${title}' was found.  Now returning ${title}...`);
      debugger;// TODOx:...this worked...need to pause longer
      return item;
    }
  }

  debugger;


  throw new Error(`Status bar item containing ${title} was not found`);
}
