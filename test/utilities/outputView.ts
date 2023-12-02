/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import clipboard from 'clipboardy';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';
import { pause } from './miscellaneous';
import { dismissAllNotifications } from './notifications';
import { runCommandFromCommandPrompt } from './commandPrompt';

export async function selectOutputChannel(name: string): Promise<void> {
  // Wait for all notifications to go away.  If there is a notification that is overlapping and hiding the Output channel's
  // dropdown menu, calling select.click() doesn't work, so dismiss all notifications first before clicking the dropdown
  // menu and opening it.
  await dismissAllNotifications();

  // Find the given channel in the Output view
  const workbench = await (await browser.getWorkbench()).wait();
  await runCommandFromCommandPrompt(workbench, 'Output: Show Output Channels...', 1);
  await browser.keys([name, 'Enter']);
  await pause(2);
}

export async function getOutputViewText(outputChannelName: string = ''): Promise<string> {
  // Set the output channel, but only if the value is passed in.
  if (outputChannelName) {
    await selectOutputChannel(outputChannelName);
  }

  // Set focus to the contents in the Output panel.
  const workbench = await (await browser.getWorkbench()).wait();
  await runCommandFromCommandPrompt(workbench, 'Output: Focus on Output View', 2);

  // Select all of the text within the panel.
  await browser.keys([CMD_KEY, 'a', 'c']);

  // Get text from the clipboard
  const outputPanelText = await clipboard.read();

  return outputPanelText;
}

// If found, this function returns the entire text that's in the Output panel.
export async function attemptToFindOutputPanelText(
  outputChannelName: string,
  searchString: string,
  attempts: number
): Promise<string | undefined> {
  await selectOutputChannel(outputChannelName);

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
