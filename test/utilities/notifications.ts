/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Notification } from 'wdio-vscode-service';
import { Duration, log } from './miscellaneous.ts';
import { getWorkbench } from './workbench.ts';
import { executeQuickPick } from './commandPrompt.ts';

export async function waitForNotificationToGoAway(
  notificationMessage: string,
  durationInSeconds: Duration
): Promise<void> {
  await findNotification(notificationMessage, false, durationInSeconds, true);
}

export async function notificationIsPresent(notificationMessage: string): Promise<boolean> {
  const notification = await findNotification(
    notificationMessage,
    true,
    Duration.milliseconds(500)
  );

  return notification ? true : false;
}

export async function notificationIsPresentWithTimeout(
  notificationMessage: string,
  durationInSeconds: Duration
): Promise<boolean> {
  log(`notificationIsPresentWithTimeout notificationMessage: ${notificationMessage}`);
  const notification = await findNotification(notificationMessage, true, durationInSeconds);

  return notification ? true : false;
}

export async function notificationIsAbsent(notificationMessage: string): Promise<boolean> {
  const notification = await findNotification(
    notificationMessage,
    false,
    Duration.milliseconds(500)
  );

  return notification ? false : true;
}

export async function notificationIsAbsentWithTimeout(
  notificationMessage: string,
  durationInSeconds: Duration
): Promise<boolean> {
  const notification = await findNotification(notificationMessage, false, durationInSeconds);

  return notification ? false : true;
}

export async function dismissNotification(
  notificationMessage: string,
  timeout = Duration.seconds(1)
): Promise<void> {
  const notification = await findNotification(notificationMessage, true, timeout, true);
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
  await executeQuickPick('Notifications: Clear All Notifications');
}

async function findNotification(
  message: string,
  shouldBePresent: boolean,
  timeout: Duration = Duration.milliseconds(500),
  throwOnTimeout: boolean = false // New parameter to control throwing on timeout
): Promise<Notification | null> {
  const workbench = await getWorkbench();

  try {
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
  } catch (error) {
    if (throwOnTimeout) {
      throw error; // Re-throw the error if throwOnTimeout is true
    }
    // Handle the timeout gracefully
    return null;
  }
}
