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
    let isPresent = await utilities.notificationIsPresentWithTimeout(
      'Modify the file and retrieve again',
      utilities.Duration.seconds(2)
    );
    await expect(isPresent).toBe(true);
    await utilities.dismissNotification('Modify the file and retrieve again');
    await utilities.pause(utilities.Duration.seconds(1));
    isPresent = await utilities.notificationIsAbsentWithTimeout(
      'Modify the file and retrieve again',
      utilities.Duration.seconds(1)
    );
    await expect(isPresent).toBe(false);
    await utilities.pause(utilities.Duration.seconds(2));
  });
  it('should show a notification with two actions', async () => {
    await showNotificationWithActions('Choose an action:', 'A', 'B');
    let isPresent = await utilities.notificationIsPresentWithTimeout(
      'Choose an action:',
      utilities.Duration.seconds(1)
    );
    await expect(isPresent).toBe(true);
    await utilities.pause(utilities.Duration.seconds(1));

    await utilities.acceptNotification('Choose an action:', 'A', utilities.Duration.seconds(1));

    isPresent = await utilities.notificationIsAbsentWithTimeout(
      'Choose an action:',
      utilities.Duration.seconds(5)
    );
    await expect(isPresent).toBe(false);
  });
});
