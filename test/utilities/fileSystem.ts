/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as fs from 'fs-extra';
import path from 'path';
import { TestSetup } from '../testSetup';
import { log } from './miscellaneous';

export function createFolder(folderPath: string): Promise<void> {
  return fs.mkdirp(folderPath);
}

export function removeFolder(folderPath: string): Promise<void> {
  return fs.rm(folderPath, { recursive: true, force: true });
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
      log(`source was: '${source}'`);
      log(`destination was: '${destination}'`);
      await testSetup.tearDown();
      throw error;
    }
  });
}
