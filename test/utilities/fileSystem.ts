/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ChildProcess, exec } from 'child_process';
import * as fs from 'fs-extra';
import path from 'path';
import { TestSetup } from '../testSetup.ts';
import { log } from './miscellaneous.ts';

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
  const source = path.join(tempFolderPath!, '..', 'test', 'testData', 'CustomSObjects');
  const destination = path.join(projectPath!, 'force-app', 'main', 'default', 'objects');
  // fs.copy(source, destination, { recursive: true }, async (error) => {
  fs.copy(source, destination, { recursive: true } as fs.CopyOptions, async (error) => {  
    if (error) {
      log(`Failed in copying custom objects ${error.message}`);
      log(`source was: '${source}'`);
      log(`destination was: '${destination}'`);
      await testSetup.tearDown();
      throw error;
    }
  });
}
