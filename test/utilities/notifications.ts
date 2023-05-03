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

export async function dismissAllNotifications(): Promise<void> {
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

        await pause(1);
      } catch(err) {
        debugger;
      }
    }

    await pause(1);
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
