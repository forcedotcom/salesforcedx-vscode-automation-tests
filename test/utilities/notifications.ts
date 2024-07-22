/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Notification } from 'wdio-vscode-service';
import { Duration, log } from './miscellaneous.ts';
import { getWorkbench } from './workbench.ts';

export async function waitForNotificationToGoAway(
  notificationMessage: string,
  durationInSeconds: Duration
): Promise<void> {
  await findNotification(notificationMessage, false, durationInSeconds);
}

export async function notificationIsPresent(notificationMessage: string): Promise<boolean> {
  const notification = await findNotification(notificationMessage, true, Duration.seconds(1));

  return notification ? true : false;
}

export async function notificationIsPresentWithTimeout(
  notificationMessage: string,
  durationInSeconds: Duration
): Promise<boolean> {
  const notification = await findNotification(notificationMessage, true, durationInSeconds);

  return notification ? true : false;
}

export async function notificationIsAbsent(notificationMessage: string): Promise<boolean> {
  const notification = await findNotification(notificationMessage, false, Duration.seconds(1));

  return notification ? true : false;
}

export async function notificationIsAbsentWithTimeout(
  notificationMessage: string,
  durationInSeconds: Duration
): Promise<boolean> {
  const notification = await findNotification(notificationMessage, false, durationInSeconds);

  return notification ? true : false;
}

export async function dismissNotification(
  notificationMessage: string,
  timeout = Duration.seconds(1)
): Promise<void> {
  const notification = await findNotification(notificationMessage, true, timeout);
  await notification?.dismiss();
}

export async function acceptNotification(
  notificationMessage: string,
  actionName: string,
  timeout: Duration
): Promise<void> {
  const notification = await findNotification(notificationMessage, true, timeout);
  if (!notification) {
    throw new Error(
      `Could not take action ${actionName} for notification with message ${notificationMessage}`
    );
  }

  const elemment = await notification.elem;
  const actionButton = await elemment.$(`.//a[@role="button"][text()="${actionName}"]`);
  await actionButton.click();
}

export async function dismissAllNotifications(): Promise<void> {
  const workbench = await getWorkbench();
  await browser.waitUntil(async () => {
    const notifications = await workbench.getNotifications();
    for (const notification of notifications) {
      try {
        await notification.dismiss();
      } catch {
        log(
          'ERROR: Can\'t call $ on element with selector ".notification-toast-container" because element wasn\'t found'
        );
      }
    }
    return !(await workbench.hasNotifications());
  });
}

export async function findNotification(
  message: string,
  shouldBePresent: boolean,
  timeout: Duration = Duration.seconds(5)
): Promise<Notification | null> {
  const workbench = await getWorkbench();

  const foundNotification = await browser.waitUntil(
    async () => {
      const notifications = await workbench.getNotifications();
      let bestMatch: Notification | null = null;

      for (const notification of notifications) {
        const notificationMessage = await notification.getMessage();

        if (notificationMessage === message || notificationMessage.startsWith(message)) {
          bestMatch = notification;
          break;
        }
      }

      if (shouldBePresent) {
        return bestMatch;
      } else {
        return bestMatch === null;
      }
    },
    {
      timeout: timeout.milliseconds,
      timeoutMsg: `Notification with message "${message}" ${shouldBePresent ? 'not found' : 'still present'} within the specified timeout of ${timeout.seconds} seconds.`
    }
  );

  return shouldBePresent ? foundNotification : null;
}
