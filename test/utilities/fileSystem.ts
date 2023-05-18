/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { ChildProcess, exec } from 'child_process';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { log, pause } from './miscellaneous';
import * as fs from 'fs-extra';
import path from 'path';
import { TestSetup } from '../testSetup';
import { TextEditor } from 'wdio-vscode-service';

export function createFolder(folderPath: string): ChildProcess {
  const childProcess = exec(`mkdir "${folderPath}"`);

  return childProcess;
}

export function removeFolder(folderPath: string): ChildProcess {
  const childProcess = exec(`rm -rf "${folderPath}"`);

  return childProcess;
}

export async function createCustomObjects(testSetup: TestSetup): Promise<void> {
  const projectPath = testSetup.projectFolderPath;
  const tempFolderPath = testSetup.tempFolderPath;
  const source = path.join(
    tempFolderPath!,
    '..',
    'test',
    'testData',
    'CustomSObjects'
  );
  const destination = path.join(
    projectPath!,
    'force-app',
    'main',
    'default',
    'objects'
  );
  fs.copy(source, destination, { recursive: true }, async error => {
    if (error) {
      log(`Failed in copying custom objects ${error.message}`);
      await testSetup.tearDown();
      throw error;
    }
  });
}

export async function createManifestFile(testSetup: TestSetup): Promise<void> {
  // const projectPath = testSetup.projectFolderPath;
  // const tempFolderPath = testSetup.tempFolderPath;
  // const source = path.join(
  //   tempFolderPath!,
  //   '..',
  //   'test',
  //   'testData',
  //   'manifest'
  // );
  // fs.copy(source, projectPath!, { recursive: true }, async error => {
  //   if (error) {
  //     log(`Failed in copying manifest file ${error.message}`);
  //     await testSetup.tearDown();
  //     throw error;
  //   }
  // });
  const workbench = await browser.getWorkbench();
  const editorView = workbench.getEditorView();

  const tempFolderPath = testSetup.tempFolderPath;
  // Using the Command palette, run File: New File...
  const inputBox = await runCommandFromCommandPrompt(
    workbench,
    'Create: New File...',
    1
  );

  // Set the name of the new manifest file
  await inputBox.setText(path.join(tempFolderPath!, '/manifest/manifest.xml'));
  await inputBox.confirm();
  await inputBox.confirm();
  const textEditor = (await editorView.openEditor(
    'manifest.xml'
  )) as TextEditor;
  const content = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<Package xmlns="http://soap.sforce.com/2006/04/metadata">`,
    `\t<types>`,
    `\t\t<members>Customer__c</members>`,
    `\t\t<members>Product__c</members>`,
    `\t\t<name>CustomObject</name>`,
    `\t</types>`,
    `\t<version>57.0</version>`,
    `</Package>`
  ].join('\n');

  await textEditor.setText(content);
  await textEditor.save();
  await pause(1);
}
