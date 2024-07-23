/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
 
import * as utilities from '../utilities/index.ts'; // Assuming utilities is a module in your project

async function showNotification(message: string) {
  await browser.executeWorkbench(async (vscode, message) => {
    vscode.window.showInformationMessage(`${message}`);
  }, message);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function showNotificationWithActions(message: string, ...actions: string[]) {
  await browser
    .executeWorkbench(
      async (vscode, message, ...actions) => {
        vscode.window.showInformationMessage(`${message}`, ...actions);
      },
      message,
      ...actions
    )
    .then(() => {});
}

describe('Notifications', async () => {
  // Show a notification
  it('should show an info notification', async () => {
    await showNotification('Modify the file and retrieve again');
    const isPresent = await utilities.notificationIsPresentWithTimeout(
      'Modify the file and retrieve again',
      utilities.Duration.seconds(2)
    );
    await expect(isPresent).toBe(true);
    await utilities.dismissNotification('Modify the file and retrieve again');
    await utilities.pause(utilities.Duration.seconds(1));
    const isNotPresent = await utilities.notificationIsAbsentWithTimeout(
      'Modify the file and retrieve again',
      utilities.Duration.seconds(1)
    );
    await expect(isNotPresent).toBe(true);
    await utilities.pause(utilities.Duration.seconds(2));
  });
  it('should show a notification with two actions', async () => {
    await showNotificationWithActions('Choose an action:', 'A', 'B');
    const isPresent = await utilities.notificationIsPresentWithTimeout(
      'Choose an action:',
      utilities.Duration.seconds(1)
    );
    await expect(isPresent).toBe(true);
    await utilities.pause(utilities.Duration.seconds(1));

    await utilities.acceptNotification('Choose an action:', 'A', utilities.Duration.seconds(1));

    const isNotPresent = await utilities.notificationIsAbsentWithTimeout(
      'Choose an action:',
      utilities.Duration.seconds(5)
    );
    await expect(isNotPresent).toBe(true);
  });
});
