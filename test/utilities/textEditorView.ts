import clipboard from 'clipboardy';
import *  as utilities from './index.ts';

import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;


export async function attemptToFindTextEditorText(fileName: string): Promise<string> {
  // error handler to be implemented
  const workbench = await utilities.getWorkbench();

  await utilities.getTextEditor(workbench, fileName);
  await browser.keys([CMD_KEY, 'a', 'c']);
  return await clipboard.read();
}