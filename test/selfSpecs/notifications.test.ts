import * as utilities from '../utilities/index.ts'; // Assuming utilities is a module in your project

async function showNotification(message: string) {
  await browser.executeWorkbench(async (vscode, message) => {
    vscode.window.showInformationMessage(`${message}`);
  }, message);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function showNotificationWithActions(message: string, ...actions: string[]) {
  await browser.executeWorkbench(async (vscode, message, ...actions) => {
    vscode.window.showInformationNotification(
      `${message}`,
      ...actions
    );
  }, message, ...actions).then(() => {});
}

describe('Notifications', async () => {
  // Show a notification
  it.skip('should show an info notification', async () => {
    await showNotification('Modify the file and retrieve again');
    const workbench = await utilities.getWorkbench();
    let isPresent = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Modify the file and retrieve again',
      utilities.Duration.seconds(1)
    );
    await utilities.pause(utilities.Duration.seconds(5));
    await expect(isPresent).toBe(true);
    await utilities.dismissNotification(workbench, 'Modify the file and retrieve again', true);
    isPresent = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Modify the file and retrieve again',
      utilities.Duration.seconds(1)
    );
    await expect(isPresent).toBe(false);
    await utilities.pause(utilities.Duration.seconds(2));
  });
  it('should show a notification with two actions', async () => {
    await utilities.executeQuickPick('Developer: Toggle Developer Tools');
    await showNotificationWithActions('Choose an action:', 'A', 'B');
    const workbench = await utilities.getWorkbench();
    let isPresent = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Choose an action:',
      utilities.Duration.seconds(1)
    );
    await expect(isPresent).toBe(true);
    await utilities.pause(utilities.Duration.seconds(5));
    await utilities.acceptNotification(workbench, 'Choose an action:', 'A', 5);
    isPresent = await utilities.notificationIsPresentWithTimeout(
      workbench,
      'Choose an action:',
      utilities.Duration.seconds(1)
    );
    await expect(isPresent).toBe(false);
  });
});
