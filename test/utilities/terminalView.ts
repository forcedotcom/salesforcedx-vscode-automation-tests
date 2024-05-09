/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import clipboard from 'clipboardy';
import { TerminalView, Workbench } from 'wdio-vscode-service';
import { CMD_KEY } from 'wdio-vscode-service/dist/constants';
import { log, pause } from './miscellaneous';
import { runCommandFromCommandPrompt } from './commandPrompt';

export async function getTerminalView(workbench: Workbench): Promise<TerminalView> {
  const bottomBar = await workbench.getBottomBar().wait();
  const terminalView = await (await bottomBar.openTerminalView()).wait();

  return terminalView;
}

export async function getTerminalViewText(workbench: Workbench, seconds: number): Promise<string> {
  await pause(seconds);
  runCommandFromCommandPrompt(workbench, 'Terminal: Copy Last Command Output', 2);

  // await browser.keys([process.platform == 'darwin' ? CMD_KEY : 'Control', 'a', 'c']);
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
  await pause(5);
  await terminalView.executeCommand(command);

  return terminalView;
}
