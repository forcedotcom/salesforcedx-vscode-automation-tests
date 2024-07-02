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

type TimeParts = {
  hours: string;
  minutes: string;
  seconds: string;
  secondFraction: string;
};

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
  const tRegex = /((?<hours>\d+):(?<minutes>\d+):(?<seconds>\d+)(?<secondFraction>\.\d+))/g;
  let matches;
  const groups: TimeParts[] = [];
  while ((matches = tRegex.exec(outputText)) !== null) {
    const group = matches.groups as TimeParts; // Type assertion
    groups.push(group);
  }
  const [startTime, endTime] = groups.map((group) =>
    Object.entries(group)
      .map(([key, value]) => ({ [key]: Number(value) }))
      .reduce(
        (acc, curr, index) => {
          switch (index) {
            case 0:
              acc.setHours(curr.hours);
              break;
            case 1:
              acc.setMinutes(curr.minutes);
              break;
            case 2:
              acc.setSeconds(curr.seconds);
              break;
            case 3:
              acc.setMilliseconds(curr.secondFraction * 1000);
              break;
            default:
              break;
          }
          return acc;
        },
        new Date(1970, 0, 1)
      )
  );
  let diff = endTime.getTime() - startTime.getTime();
  // Convert the difference to hours, minutes, and seconds
  const hours = Math.floor(diff / 1000 / 60 / 60);
  diff -= hours * 1000 * 60 * 60;
  const minutes = Math.floor(diff / 1000 / 60);
  diff -= minutes * 1000 * 60;
  const seconds = Math.floor(diff / 1000);
  diff -= seconds * 1000;
  const milliseconds = diff;

  // return `${hours}:${minutes}:${seconds}.${milliseconds}`;

  return `${formatTimeComponent(hours)}:${formatTimeComponent(minutes)}:${formatTimeComponent(
    seconds
  )}.${formatTimeComponent(milliseconds, 3)}`;
}

function formatTimeComponent(component: number, padLength: number = 2): string {
  return component.toString().padStart(padLength, '0');
}
