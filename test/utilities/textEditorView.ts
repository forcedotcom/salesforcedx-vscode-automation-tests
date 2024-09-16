import clipboard from 'clipboardy';
import *  as utilities from './index.ts';
import { TextEditor, Workbench } from 'wdio-vscode-service';


import { Key } from 'webdriverio';
const CMD_KEY = process.platform === 'darwin' ? Key.Command : Key.Control;


export async function attemptToFindTextEditorText(filePath: string): Promise<string> {
  await utilities.openFile(filePath);
  await browser.keys([CMD_KEY, 'a', 'c']);
  return await clipboard.read();
}

/**
 * WARN: The func does not work properly on Windows for a large project because of long indexing time! Use openFile instead
 * open a file in the text editor by file name
 * @param workbench page object representing the custom VSCode title bar
 * @param fileName name of the file we want to open and use
 * @returns editor for the given file name
 */
export async function getTextEditor(workbench: Workbench, fileName: string): Promise<TextEditor> {
  const inputBox = await utilities.executeQuickPick('Go to File...', utilities.Duration.seconds(1));
  await inputBox.setText(fileName);
  await inputBox.confirm();
  await utilities.pause(utilities.Duration.seconds(1));
  const editorView = workbench.getEditorView();
  const textEditor = (await editorView.openEditor(fileName)) as TextEditor;
  return textEditor;
}