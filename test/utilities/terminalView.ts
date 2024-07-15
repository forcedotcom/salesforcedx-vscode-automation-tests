/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import clipboard from 'clipboardy';
import { TerminalView, Workbench } from 'wdio-vscode-service';
import { log, pause } from './miscellaneous.ts';
import { Duration } from '@salesforce/kit';
import { executeQuickPick } from './commandPrompt.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;

export async function getTerminalView(workbench: Workbench): Promise<TerminalView> {
  const bottomBar = await workbench.getBottomBar().wait();
  const terminalView = await (await bottomBar.openTerminalView()).wait();

  return terminalView;
}

export async function getTerminalViewText(workbench: Workbench, seconds: Duration): Promise<string> {
  await executeQuickPick('Terminal: Focus Terminal', Duration.seconds(1));
  await pause(seconds);

  await browser.keys([process.platform == 'darwin' ? CMD_KEY : 'Control', 'a', 'c']);
  // runCommandFromCommandPrompt(workbench, 'Terminal: Copy Last Command Output', 2);

  const terminalText = await clipboard.read();
  return terminalText;
}

export async function executeCommand(workbench: Workbench, command: string): Promise<TerminalView> {
  log(`Executing the command, "${command}"`);

  const terminalView = await (await getTerminalView(workbench)).wait();
  if (!terminalView) {
    throw new Error(
      'In executeCommand(), the terminal view returned from getTerminalView() was null (or undefined)'
    );
  }
  await pause(Duration.seconds(5));
  await terminalView.executeCommand(command);

  return terminalView;
}
