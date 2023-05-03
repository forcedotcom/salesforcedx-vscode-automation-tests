/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  Notification,
  Workbench
} from 'wdio-vscode-service';
import {
  log,
  pause
} from './miscellaneous';
import {
  getWorkbench
} from'./workbench';

export async function waitForNotificationToGoAway(workbench: Workbench, notificationMessage: string, durationInSeconds: number, matchExactString: boolean = true): Promise<void> {
  // Change timeout from seconds to milliseconds
  durationInSeconds *= 1000;

  await pause(5);
  const startDate = new Date();
  while (true) {
    let notificationWasFound = await notificationIsPresent(workbench, notificationMessage, matchExactString);
    if (!notificationWasFound) {
      return;
    }

    const currentDate = new Date();
    const secondsPassed = Math.abs(currentDate.getTime() - startDate.getTime()) / 1000;
    if (secondsPassed >= durationInSeconds) {
      throw new Error(`Exceeded time limit - notification "${notificationMessage}" is still present`);
    }
  }
}

export async function notificationIsPresent(workbench: Workbench, notificationMessage: string, matchExactString: boolean = true): Promise<boolean> {
  const notifications = await getNotifications(workbench);
  for (const notification of notifications) {
    const message = await getMessage(notification);
    if (matchExactString) {
      if (message === notificationMessage) {
        return true;
      }
    } else {
      if (message.startsWith(notificationMessage)) {
        return true;
      }
    }
  }

  return false;
}

export async function attemptToFindNotification(workbench: Workbench, notificationMessage: string, attempts: number): Promise<boolean> {
  while (attempts > 0) {
    if (await notificationIsPresent(workbench, notificationMessage)) {
      return true;
    }

    await pause(1);
    attempts--;
  }

  return false;
}

export async function dismissAllNotifications0(): Promise<void> {
  /*
  const workbench = await (await browser.getWorkbench()).wait();
  await browser.waitUntil(async () => {
    const notifications = await workbench.getNotifications();
    for (const notification of notifications) {
        await notification.dismiss();
    }

    return !(await workbench.hasNotifications());
  });
  */


  // Can't call $ on element with selector ".notification-toast-container" because element wasn't found
  const notificationToastContainer = await $('.notification-toast-container');
  if (!notificationToastContainer) {
    debugger;
    // one more time
    const notificationToastContainer2 = await $('.notification-toast-container');
    debugger;
  }


  /*
  // what the wdio library has:
  const workbench = await browser.getWorkbench();
  await browser.waitUntil(async () => {
      const notifications = await workbench.getNotifications();
      for (const notification of notifications) {
          await notification.dismiss();
      }

      return !(await workbench.hasNotifications());
  });
  */

  // still getting the "Can't call $ on element with selector ".notification-toast-container" because element wasn't found" error

  log('now calling browser.getWorkbench()...');
  const workbench = await (await browser.getWorkbench()).wait();
  log('...finished calling browser.getWorkbench()');

  log('now calling workbench.hasNotifications()...');
  let hasNotifications = await workbench.hasNotifications();
  log('...finished calling workbench.hasNotifications()');

  while (hasNotifications) {
    log('notifications were found, now dismissing them...');

    log('now calling workbench.getNotifications()...');
    const notifications = await getNotifications(workbench);
    log('...finished calling workbench.getNotifications()');


    /*
    take 1:
    for (const notification of notifications) {
      // await notification.dismiss();
      // TODOx: - extra guard
      const notificationToastContainer3 = await $('.notification-toast-container');
      if (notificationToastContainer3) {
        await notification.dismiss();
      } else {
        debugger;
        const notificationToastContainer4 = await $('.notification-toast-container');
        debugger;
        await notification.dismiss();
        debugger;
      }

      pause(1);
    }
    */

    // comments...
    /*
    OK, we have:
    const notificationToastContainer3 = await $('.notification-toast-container');
    if (notificationToastContainer3) {
      await notification.dismiss();

    ...yet I just go this error:
[0-0] Error in "Run Apex Tests.Run All Tests via Apex Class"
Error: Can't call $ on element with selector ".notification-toast-container" because element wasn't found
    at async StandaloneNotification.dismiss (/Users/jbeeghly/src/github.com/forcedotcom/salesforcedx-vscode-automation-tests/node_modules/wdio-vscode-service/src/pageobjects/workbench/Notification.ts:97:21)
    at async dismissAllNotifications (/Users/jbeeghly/src/github.com/forcedotcom/salesforcedx-vscode-automation-tests/test/utilities/notifications.ts:114:9)
    at async selectOutputChannel (/Users/jbeeghly/src/github.com/forcedotcom/salesforcedx-vscode-automation-tests/test/utilities/outputView.ts:29:3)
    at async Object.attemptToFindOutputPanelText (/Users/jbeeghly/src/github.com/forcedotcom/salesforcedx-vscode-automation-tests/test/utilities/outputView.ts:94:3)
    at async Context.<anonymous> (/Users/jbeeghly/src/github.com/forcedotcom/salesforcedx-vscode-automation-tests/test/specs/runApexTests.e2e.ts:71:29)
      ...wtf?
    */

    // for (const notification of notifications) {
    for(let i=0; i<notifications.length; i++) {
      try {
        const notification = notifications[i];
        if (!notification) {
          debugger;
          log(`notifications[${i}] is undefined`);
        }

        const notificationToastContainer3 = await $('.notification-toast-container');
        if (!notificationToastContainer3) {
          debugger;
          log('notificationToastContainer3 was not found');
        }

        const message = await getMessage(notification);
        log(`Notification: '${message}'`);

        const notificationToastContainer4 = await $('.notification-toast-container');
        if (!notificationToastContainer4) {
          debugger;
          log('notificationToastContainer4 was not found');
        }

        log('now calling notification.dismiss()...');
        await notification.dismiss();
        log('...finished calling notification.dismiss()');

        pause(1);
      } catch(err) {
        debugger;
      }
    }

    pause(1);
    log('now calling workbench.hasNotifications()...');
    hasNotifications = await workbench.hasNotifications();
    log('...finished calling workbench.hasNotifications()');
  }
}

export async function dismissAllNotifications(): Promise<void> {
  /*
  const workbench = await (await browser.getWorkbench()).wait();
  await browser.waitUntil(async () => {
    const notifications = await workbench.getNotifications();
    for (const notification of notifications) {
        await notification.dismiss();
    }

    return !(await workbench.hasNotifications());
  });
  */


  await pause(1);
  const workbench = await getWorkbench();

  await pause(1);
  let notificationsAreAvailable = await hasNotifications(workbench);
  while (notificationsAreAvailable) {
    const notifications = await getNotifications(workbench);
    for(let i=0; i<notifications.length; i++) {
      try {
        const notification = notifications[i];
        if (!notification) {
          debugger;
          log(`notifications[${i}] is undefined`);
        }

        const message = await getMessage(notification);
        log(`Notification: '${message}'`);

        log('now calling notification.dismiss()...');
        await dismiss(notification);
        log('...finished calling notification.dismiss()');

        pause(1);
      } catch(err) {
        debugger;
      }
    }

    pause(1);
    notificationsAreAvailable = await hasNotifications(workbench);
  }
}

export async function hasNotifications(workbench: Workbench): Promise<boolean> {
  const notificationToastContainer = await $('.notification-toast-container');
  if (!notificationToastContainer) {
    return false;
  }

  const hasNotifications = await workbench.hasNotifications();
  return hasNotifications;
}

export async function getNotifications(workbench: Workbench): Promise<Notification[]> {
  const notificationToastContainer = await $('.notification-toast-container');
  if (!notificationToastContainer) {
    return [];
  }

  const notifications = await workbench.getNotifications();
  return notifications;
}

export async function getMessage(notification: Notification): Promise<string> {
  const notificationToastContainer = await $('.notification-toast-container');
  if (!notificationToastContainer) {
    return '';
  }

  const message = await notification.getMessage();
  return message;
}

export async function dismiss(notification: Notification): Promise<void> {
  const notificationToastContainer = await $('.notification-toast-container');
  if (!notificationToastContainer) {
    return;
  }

  await notification.dismiss();
}
