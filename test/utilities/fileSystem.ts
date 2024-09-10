/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import path from 'path';
import { TestSetup } from '../testSetup.ts';
import { log } from './miscellaneous.ts';
import FastGlob from 'fast-glob';
import { RefactoredTestSetup } from '../RefactoredTestSetup.ts';

export function createFolder(folderPath: string): void {
  fs.mkdirSync(folderPath, { recursive: true });
}

export function removeFolder(folderPath: string): void {
  fs.rmdirSync(folderPath, { recursive: true });
}

export async function createCustomObjects(testSetup: TestSetup | RefactoredTestSetup): Promise<void> {
  const projectPath = testSetup.projectFolderPath;
  const tempFolderPath = testSetup.tempFolderPath;
  if (!tempFolderPath) {
    throw new Error('tempFolderPath is undefined');
  }
  const source = path.join(tempFolderPath, '..', 'test', 'testData', 'CustomSObjects');
  const destination = path.join(projectPath!, 'force-app', 'main', 'default', 'objects');

  // Ensure the project path has been created
  fs.mkdirSync(path.dirname(destination), { recursive: true });

  const copyRecursive = (src: string, dest: string) => {
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach((child) => {
        copyRecursive(path.join(src, child), path.join(dest, child));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };

  try {
    copyRecursive(source, destination);
  } catch (error) {
    if (error instanceof Error) {
      log(`Failed in copying custom objects ${error.message}`);
    }
    log(`source was: '${source}'`);
    log(`destination was: '${destination}'`);
    await testSetup?.tearDown();
    throw error;
  }
}

/**
 * Scans the directory for vsix files and returns the full path to each file
 * @param vsixDir
 * @returns
 */
export function getVsixFilesFromDir(vsixDir: string): string[] {
  return FastGlob.sync('**/*.vsix', { cwd: vsixDir }).map((vsixFile) =>
    path.join(vsixDir, vsixFile)
  );
}

/**
 * Check if the given path refers to a directory
 * @param folderPath
 * @returns folder name
 */
export function getFolderName(folderPath: string): string | null {
  try {
    // Check if the given path exists and if it is a directory
    const stats = fs.statSync(folderPath);
    if (stats.isDirectory()) {
      // Extract and return the folder name
      return path.basename(folderPath);
    } else {
      return null; // It's not a directory
    }
  } catch (err) {
    console.error('Error checking path:', err);
    return null; // The path doesn't exist or isn't accessible
  }
}
