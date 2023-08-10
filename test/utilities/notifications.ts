/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { pause } from './miscellaneous';
import * as utilities from '../utilities';

export async function waitForNotificationToGoAway(
  workbench: Workbench,
  notificationMessage: string,
  durationInSeconds: number,
  matchExactString: boolean = true
): Promise<void> {
  // Change timeout from seconds to milliseconds
  durationInSeconds *= 1000;

  await pause(5);
  const startDate = new Date();
  while (true) {
    let notificationWasFound = await notificationIsPresent(
      workbench,
      notificationMessage,
      matchExactString
    );
    if (!notificationWasFound) {
      return;
    }

    const currentDate = new Date();
    const secondsPassed = Math.abs(currentDate.getTime() - startDate.getTime()) / 1000;
    if (secondsPassed >= durationInSeconds) {
      throw new Error(
        `Exceeded time limit - notification "${notificationMessage}" is still present`
      );
    }
  }
}

export async function notificationIsPresent(
  workbench: Workbench,
  notificationMessage: string,
  matchExactString: boolean = true
): Promise<boolean> {
  const notifications = await workbench.getNotifications();
  for (const notification of notifications) {
    const message = await notification.getMessage();
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

export async function notificationIsPresentWithTimeout(
  workbench: Workbench,
  notificationMessage: string,
  durationInSeconds: number,
  matchExactString: boolean = true
): Promise<boolean> {

  utilities.log('Enter utilities.notificationIsPresentWithTimeout()');

  // Change timeout from seconds to milliseconds
  durationInSeconds *= 1000;

  const startDate = new Date();
  utilities.log('startDate = ' + startDate);

  // Keep on searching for the notification until it is found or the timeout is reached
  while (true) {
    const notifications = await workbench.getNotifications(); //need to get the new notifications that show up
    utilities.log('A new iteration of the while loop');
    for (const notification of notifications) {
      const message = await notification.getMessage();
      utilities.log('message = ' + message);
      if (matchExactString) {
        if (message === notificationMessage) {
          utilities.log('Found it! Return TRUE 1!');
          return true;
        }
      } else {
        if (message.startsWith(notificationMessage)) {
          utilities.log('Found it! Return TRUE 2!');
          return true;
        }
      }
    }
    pause(1);

    const currentDate = new Date();
    utilities.log('currentDate = ' + currentDate);
    const secondsPassed = Math.abs(currentDate.getTime() - startDate.getTime()) / 1000;
    utilities.log('secondsPassed = ' + secondsPassed);
    if (secondsPassed >= durationInSeconds) {
      utilities.log('Notification not found! Return FALSE!')
      return false;
    }
  }
}

export async function dismissNotification(
  workbench: Workbench,
  notificationMessage: string,
  matchExactString: boolean = true
): Promise<void> {
  utilities.log('notificationMessage = ' + notificationMessage);
  const notifications = await workbench.getNotifications();
  for (const notification of notifications) {
    const message = await notification.getMessage();
    utilities.log('current message is: ' + message);
    if (matchExactString) {
      if (message === notificationMessage) {
        utilities.log('HERE');
        //TODO: Click on the notification and then click the 'Clear notification' button (the X)
        // await notification.elem.click();  //Is this needed?
        await(notification.dismiss());
        utilities.log('DISMISSED');
      }
    }
  }
}

export async function attemptToFindNotification(
  workbench: Workbench,
  notificationMessage: string,
  attempts: number
): Promise<boolean> {
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
  const workbench = await (await browser.getWorkbench()).wait();
  await browser.waitUntil(async () => {
    const notifications = await workbench.getNotifications();
    for (const notification of notifications) {
      await notification.dismiss();
    }

    return !(await workbench.hasNotifications());
  });
}
