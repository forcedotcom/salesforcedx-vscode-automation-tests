/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import clipboard from 'clipboardy';
import { OutputView } from 'wdio-vscode-service';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';
import { pause } from './miscellaneous';
import { dismissAllNotifications } from './notifications';

export async function selectOutputChannel(outputView: OutputView, name: string): Promise<void> {
  // Wait for all notifications to go away.  If there is a notification that is overlapping and hiding the Output channel's
  // dropdown menu, calling select.click() doesn't work, so dismiss all notifications first before clicking the dropdown
  // menu and opening it.
  await dismissAllNotifications();

  // Find the channel the Output view is current set to.
  const dropDownMenu = await outputView.parent.$('select.monaco-select-box');
  const currentChannelName = await dropDownMenu.getValue();
  if (currentChannelName === name) {
    // If the output channel is already set, don't do anything and just return.
    return;
  }

  // Open the Output panel's dropdown menu.
  await dropDownMenu.click();

  // Click the target channel.
  const channels = await dropDownMenu.$$('option');
  for (const channel of channels) {
    const val = await channel.getValue();
    if (val === name) {
      await channel.click();

      // eslint-disable-next-line wdio/no-pause
      await browser.pause(200);
      await browser.keys(['Escape']);
      await pause(1);
      return;
    }
  }

  throw new Error(`Channel ${name} not found`);
}

export async function openOutputView(): Promise<OutputView> {
  const workbench = await (await browser.getWorkbench()).wait();
  const bottomBar = await workbench.getBottomBar(); // selector is 'div[id="workbench.parts.panel"]'
  const outputView = await bottomBar.openOutputView(); // selector is 'div[id="workbench.panel.output"]'
  await pause(2);

  return outputView;
}

export async function getOutputViewText(outputChannelName: string = ''): Promise<string> {
  const outputView = await openOutputView();

  // Set the output channel, but only if the value is passed in.
  if (outputChannelName) {
    await selectOutputChannel(outputView, outputChannelName);
  }

  // Set focus to the contents in the Output panel.
  await (await outputView.elem).click();
  await pause(1);

  // Select all of the text within the panel.
  await browser.keys([CMD_KEY, 'a', 'c']);
  // Should be able to use Keys.Ctrl, but Keys is not exported from webdriverio
  // See https://webdriver.io/docs/api/browser/keys/

  const outputPanelText = await clipboard.read();

  return outputPanelText;
}

// If found, this function returns the entire text that's in the Output panel.
export async function attemptToFindOutputPanelText(
  outputChannelName: string,
  searchString: string,
  attempts: number
): Promise<string | undefined> {
  const outputView = await openOutputView();
  await selectOutputChannel(outputView, outputChannelName);

  while (attempts > 0) {
    const outputViewText = await getOutputViewText();
    if (outputViewText.includes(searchString)) {
      return outputViewText;
    }

    await pause(1);
    attempts--;
  }

  return undefined;
}

export async function getOperationTime(outputText: string): Promise<string> {
  const initialTime = outputText.substring(
    outputText.indexOf('.') - 8,
    outputText.indexOf('.') + 4
  );
  const endTime = outputText.substring(
    outputText.lastIndexOf('.') - 8,
    outputText.lastIndexOf('.') + 4
  );
  let [hours1, minutes1, seconds1, milliseconds1] = initialTime.split(':').map(Number);
  let [hours2, minutes2, seconds2, milliseconds2] = endTime.split(':').map(Number);
  [seconds1, milliseconds1] = seconds1
    .toString()
    .split('.')
    .map(Number);
  [seconds2, milliseconds2] = seconds2
    .toString()
    .split('.')
    .map(Number);
  const totalMilliseconds1 =
    milliseconds1 + seconds1 * 1000 + minutes1 * 60 * 1000 + hours1 * 60 * 60 * 1000;
  const totalMilliseconds2 =
    milliseconds2 + seconds2 * 1000 + minutes2 * 60 * 1000 + hours2 * 60 * 60 * 1000;

  const differenceMilliseconds = totalMilliseconds2 - totalMilliseconds1;

  const hoursDiff = Math.floor(differenceMilliseconds / (60 * 60 * 1000));
  const minutesDiff = Math.floor((differenceMilliseconds % (60 * 60 * 1000)) / (60 * 1000));
  const secondsDiff = Math.floor((differenceMilliseconds % (60 * 1000)) / 1000);
  const millisecondsDiff = differenceMilliseconds % 1000;
  return `${formatTimeComponent(hoursDiff)}:${formatTimeComponent(
    minutesDiff
  )}:${formatTimeComponent(secondsDiff)}.${formatTimeComponent(millisecondsDiff, 3)}`;
}

function formatTimeComponent(component: number, padLength: number = 2): string {
  return component.toString().padStart(padLength, '0');
}
