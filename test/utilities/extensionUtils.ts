/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Workbench } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt.ts';
import { log, pause } from './miscellaneous.ts';
import fs from 'fs/promises';
import path from 'path';
import FastGlob from 'fast-glob';
import { EnvironmentSettings } from '../environmentSettings.ts';
import { exec } from 'child_process';
import * as utilities from './index.ts';

export type ExtensionId =
  | 'salesforcedx-vscode'
  | 'salesforcedx-vscode-expanded'
  | 'salesforcedx-vscode-soql'
  | 'salesforcedx-einstein-gpt'
  | 'salesforcedx-vscode-core'
  | 'salesforcedx-vscode-apex'
  | 'salesforcedx-vscode-apex-debugger'
  | 'salesforcedx-vscode-apex-replay-debugger'
  | 'salesforcedx-vscode-lightning'
  | 'salesforcedx-vscode-lwc'
  | 'salesforcedx-vscode-visualforce';

export type Extension = {
  id: string;
  extensionPath: string;
  isActive: boolean;
  packageJSON: unknown;
};

type ExtensionType = {
  extensionId: ExtensionId;
  name: string;
  vsixPath: string;
  shouldInstall: 'always' | 'never' | 'optional';
  shouldVerifyActivation: boolean;
};

const extensions: ExtensionType[] = [
  {
    extensionId: 'salesforcedx-vscode',
    name: 'Salesforce Extension Pack',
    vsixPath: '',
    shouldInstall: 'never',
    shouldVerifyActivation: false
  },
  {
    extensionId: 'salesforcedx-vscode-expanded',
    name: 'Salesforce Extension Pack (Expanded)',
    vsixPath: '',
    shouldInstall: 'never',
    shouldVerifyActivation: false
  },
  {
    extensionId: 'salesforcedx-vscode-soql',
    name: 'SOQL',
    vsixPath: '',
    shouldInstall: 'optional',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-einstein-gpt',
    name: 'Einstein for Developers (Beta)',
    vsixPath: '',
    shouldInstall: 'optional',
    shouldVerifyActivation: false
  },
  {
    extensionId: 'salesforcedx-vscode-core',
    name: 'Salesforce CLI Integration',
    vsixPath: '',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-apex',
    name: 'Apex',
    vsixPath: '',
    shouldInstall: 'always',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-apex-debugger',
    name: 'Apex Interactive Debugger',
    vsixPath: '',
    shouldInstall: 'optional',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-apex-replay-debugger',
    name: 'Apex Replay Debugger',
    vsixPath: '',
    shouldInstall: 'optional',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-lightning',
    name: 'Lightning Web Components',
    vsixPath: '',
    shouldInstall: 'optional',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-lwc',
    name: 'Lightning Web Components',
    vsixPath: '',
    shouldInstall: 'optional',
    shouldVerifyActivation: true
  },
  {
    extensionId: 'salesforcedx-vscode-visualforce',
    name: 'salesforcedx-vscode-visualforce',
    vsixPath: '',
    shouldInstall: 'optional',
    shouldVerifyActivation: true
  }
];
export async function showRunningExtensions(workbench: Workbench): Promise<void> {
  await runCommandFromCommandPrompt(workbench, 'Developer: Show Running Extensions', 5);
}

export async function findExtensionInRunningExtensionsList(
  workbench: Workbench,
  extensionId: string
): Promise<boolean> {
  // This function assumes the Extensions list was opened.

  // Close the panel and clear notifications so we can see as many of the running extensions as we can.
  try {
    // await runCommandFromCommandPrompt(workbench, 'View: Close Panel', 1);
    await runCommandFromCommandPrompt(workbench, 'Notifications: Clear All Notifications', 1);
  } catch {
    // Close the command prompt by hitting the Escape key
    await browser.keys(['Escape']);
    log('No panel or notifs to close - command not found');
  }
  pause(1);

  const extensionNameDivs = await $$(`div.monaco-list-row[aria-label="${extensionId}"]`);
  return extensionNameDivs.length === 1;
}

export async function reloadAndEnableExtensions(): Promise<void> {
  await utilities.reloadWindow();
  await utilities.enableAllExtensions();
}

export async function installExtension(extension: string, extensionsDir: string): Promise<void> {
  log(`SetUp - Started Install extension ${path.basename(extension)}`);
  const codeBin = await findVSCodeBinary();

  return new Promise((resolve, reject) => {
    const command = `"${codeBin}" --install-extension ${extension} --extensions-dir ${extensionsDir}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`Error installing extension ${extension}: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        log(`Error output for ${extension}: ${stderr}`);
      }
      log(stdout);
      log(`...SetUp - Finished Install extension ${extension}`);
      resolve();
    });
  });
}

export async function installExtensions(excludeExtensions: ExtensionId[] = []): Promise<void> {
  const workbench = await utilities.getWorkbench();
  const extensionsDir = path.resolve(path.join(EnvironmentSettings.getInstance().extensionPath));
  const extensionsVsixs = FastGlob.sync('**/*.vsix', { cwd: extensionsDir });
  if (extensionsVsixs.length === 0) {
    throw new Error(`No vsix files were found in dir ${extensionsDir}`);
  }

  // Refactored part to use the extensions array
  extensionsVsixs.forEach((vsix) => {
    const match = vsix.match(/^(?<extension>.*?)(-(?<version>\d+\.\d+\.\d+))?\.vsix$/);
    if (match && match.groups) {
      const { extension } = match.groups;
      const foundExtension = extensions.find((e) => e.extensionId === extension);
      if (foundExtension) {
        foundExtension.vsixPath = path.join(extensionsDir, vsix);
        // assign 'never' to this extension if its id is included in excluedExtensions
        foundExtension.shouldInstall = excludeExtensions.includes(foundExtension.extensionId)
          ? 'never'
          : 'always';
        // if not installing, don't verify, otherwise use default value
        foundExtension.shouldVerifyActivation =
          foundExtension.shouldInstall === 'never' ? false : foundExtension.shouldVerifyActivation;
        log(`SetUp - Found extension ${extension} with vsixPath ${foundExtension.vsixPath}`);
      }
    }
  });

  // Iterate over the extensions array to install extensions
  for (const extensionObj of extensions.filter((ext) => ext.vsixPath !== '' && ext.shouldInstall)) {
    await installExtension(extensionObj.vsixPath, extensionsDir);
  }

  await runCommandFromCommandPrompt(workbench, 'Extensions: Enable All Extensions', 5);
  await runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 10);
}

export async function verifyAllExtensionsAreRunning(): Promise<void> {
  log('');
  log(`Starting verifyAllExtensionsAreRunning()...`);

  await utilities.zoom('Out', 4, 1);

  // Goes through each and all of the extensions verifying they're running in no longer than 100 secs
  await findExtensionsWithTimeout();

  await utilities.zoomReset(1);

  log(`... Finished verifyAllExtensionsAreRunning()`);
  log('');
}

export async function findExtensionsWithTimeout(): Promise<void> {
  let forcedWait = 0;
  let extensionWasFound = false;
  const shouldVerifyActivation = extensions.filter((ext) => {
    return ext.shouldVerifyActivation;
  });
  const workbench = await utilities.getWorkbench();
  await utilities.showRunningExtensions(workbench);

  for (const extension of shouldVerifyActivation) {
    log(`Verifying extension ${extension.name} with id: ${extension.extensionId}`);
    if (extensionWasFound === false && forcedWait < 100)
      do {
        await pause(7);
        extensionWasFound = await utilities.findExtensionInRunningExtensionsList(
          workbench,
          extension.extensionId
        );
        log(`post extension check: ${extension.extensionId} : ${extensionWasFound}`);
        forcedWait += 10;
      } while (extensionWasFound === false && forcedWait < 100);
    log(`extension ${extension.name}:${extension.extensionId} was found: ${extensionWasFound}`);
    forcedWait = 0;
    expect(extensionWasFound).toBe(true);
  }
}

export async function findVSCodeBinary(): Promise<string> {
  const serviceDirPath = path.join(process.cwd(), '.wdio-vscode-service');

  const wdioServiceDirContents = await fs.readdir(serviceDirPath);

  // Search for vscode installation directory
  const vscodeInstallDir = wdioServiceDirContents.find((entry) =>
    /^vscode-.*?-\d+\.\d+\.\d+$/.test(entry)
  );

  if (!vscodeInstallDir) {
    throw new Error(`Could not find vscode install directory in ${serviceDirPath}`);
  }

  // Construct full path to vscode installation directory
  const vscodeFullPath = path.join(serviceDirPath, vscodeInstallDir);

  // Define the glob pattern for code binary
  const codeBinaryPattern = '**/bin/{code,Code.exe}';

  // Search for code binary in vscode installation directory
  const codeBin = await FastGlob(codeBinaryPattern, {
    cwd: vscodeFullPath,
    absolute: true // returning absolute paths
  });

  if (codeBin.length === 0) {
    throw new Error(`Could not find code binary in ${vscodeFullPath}`);
  }

  return codeBin[0];
}
