/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { log } from './miscellaneous';
import fs from 'fs/promises';
import path from 'path';
import FastGlob from 'fast-glob';
import { EnvironmentSettings } from '../environmentSettings';
import { exec } from 'child_process';
import * as utilities from './index';

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

export type ExtensionType = {
  extensionId: ExtensionId;
  name: string;
  vsixPath: string;
  shouldInstall: 'always' | 'never' | 'optional';
  shouldVerifyActivation: boolean;
};

export type ExtensionActivation = {
  extensionId: string;
  isPresent: boolean;
  version?: string;
  activationTime?: string;
  hasBug?: boolean;
};

export type VerifyExtensionsOptions = {
  timeout?: number;
  interval?: number;
};

const VERIFY_EXTENSIONS_TIMEOUT = 20_000;

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

export async function showRunningExtensions(): Promise<void> {
  await utilities.executeQuickPick('Developer: Show Running Extensions');
  await browser.waitUntil(
    async () => {
      const runningExtensionsTab = await $(
        "//a[@class='label-name' and text()='Running Extensions']"
      );
      return runningExtensionsTab.isDisplayed();
    },
    {
      timeout: 5000, // Timeout after 5 seconds
      interval: 500, // Check every 500 ms
      timeoutMsg: 'Expected "Running Extensions" tab to be visible after 5 seconds'
    }
  );
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
  const extensionsDir = path.resolve(path.join(EnvironmentSettings.getInstance().extensionPath));
  const extensionPattern =
    /^(?<publisher>.+?)\.(?<extensionId>.+?)-(?<version>\d+\.\d+\.\d+)(?:\.\d+)*$/;
  const foundInstalledExtensions = (await fs.readdir(extensionsDir))
    .filter(async (entry) => {
      const stats = await fs.stat(entry);
      return stats.isDirectory();
    })
    .map((entry) => {
      const match = entry.match(extensionPattern);
      if (match?.groups) {
        return {
          publisher: match.groups.publisher,
          extensionId: match.groups.extensionId,
          version: match.groups.version,
          path: entry
        };
      }
      return null;
    })
    .filter(Boolean)
    .filter((ext) =>
      extensions.find((refExt) => {
        return refExt.extensionId === ext?.extensionId;
      })
    );

  if (
    foundInstalledExtensions.length > 0 &&
    foundInstalledExtensions.every((ext) =>
      extensions.find((refExt) => refExt.extensionId === ext?.extensionId)
    )
  ) {
    log(
      `Found the following pre-installed extensions in dir ${extensionsDir}, skipping installation of vsix`
    );
    foundInstalledExtensions.forEach((ext) => {
      log(`Extension ${ext?.extensionId} version ${ext?.version}`);
    });
    return;
  }

  const extensionsVsixs = utilities.getVsixFilesFromDir(extensionsDir);
  if (extensionsVsixs.length === 0) {
    throw new Error(`No vsix files were found in dir ${extensionsDir}`);
  }

  // Refactored part to use the extensions array
  extensionsVsixs.forEach((vsix) => {
    const match = path
      .basename(vsix)
      .match(/^(?<extension>.*?)(-(?<version>\d+\.\d+\.\d+))?\.vsix$/);
    if (match?.groups) {
      const { extension } = match.groups;
      const foundExtension = extensions.find((e) => e.extensionId === extension);
      if (foundExtension) {
        foundExtension.vsixPath = vsix;
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

  await utilities.enableAllExtensions();
  await utilities.reloadWindow(10);
}

export function getExtensionsToVerifyActive(
  predicate: (ext: ExtensionType) => boolean = (ext) => !!ext
): ExtensionType[] {
  return extensions
    .filter((ext) => {
      return ext.shouldVerifyActivation;
    })
    .filter(predicate);
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

export async function verifyExtensionsAreRunning(
  extensions: ExtensionType[],
  timeout = VERIFY_EXTENSIONS_TIMEOUT
) {
  log('');
  log(`Starting verifyExtensionsAreRunning()...`);
  if (extensions.length === 0) {
    log(
      'verifyExtensionsAreRunning - No extensions to verify, continuing test run w/o extension verification'
    );
    return true;
  }

  const extensionsToVerify = extensions.map((extension) => extension.extensionId);

  await showRunningExtensions();

  await utilities.zoom('Out', 4, 1);

  let extensionsStatus: ExtensionActivation[] = [];
  let allActivated = false;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error('findExtensionsInRunningExtensionsList timeout')),
      timeout ?? VERIFY_EXTENSIONS_TIMEOUT
    )
  );

  try {
    await Promise.race([
      (async () => {
        do {
          extensionsStatus = await findExtensionsInRunningExtensionsList(extensionsToVerify);

          // Log the current state of the activation check for each extension
          for (const extensionStatus of extensionsStatus) {
            log(
              // prettier-ignore
              `Extension ${extensionStatus.extensionId}: ${extensionStatus.activationTime ?? 'Not activated'}`
            );
          }

          allActivated = extensionsStatus.every(
            (extensionStatus) => extensionStatus.activationTime
          );
        } while (!allActivated);
      })(),
      timeoutPromise
    ]);
  } catch (error) {
    log(`Error while waiting for extensions to activate: ${error}`);
  }

  await utilities.zoomReset(1);

  log('... Finished verifyExtensionsAreRunning()');
  log('');

  return allActivated;
}

export async function findExtensionsInRunningExtensionsList(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  extensionIds: string[]
): Promise<ExtensionActivation[]> {
  // This function assumes the Extensions list was opened.

  // Close the panel and clear notifications so we can see as many of the running extensions as we can.
  try {
    // await runCommandFromCommandPrompt(workbench, 'View: Close Panel', 1);
    await utilities.executeQuickPick('Notifications: Clear All Notifications', 1);
  } catch {
    // Close the command prompt by hitting the Escape key
    await browser.keys(['Escape']);
    log('No panel or notifs to close - command not found');
  }

  // Get all extensions
  const allExtensions = await $$('div.monaco-list-row > div.extension');

  const runningExtensions: ExtensionActivation[] = [];
  for (const extension of allExtensions) {
    const parent = await extension.parentElement();
    const extensionId = await parent.getAttribute('aria-label');
    const version = await extension.$('.version').getText();
    const activationTime = await extension.$('.activation-time').getText();
    const bugSpan = await parent.$('span.codicon-bug');
    const hasBug = bugSpan?.error?.message.startsWith('no such element') ? false : true;
    runningExtensions.push({ extensionId, activationTime, version, isPresent: true, hasBug });
  }

  // limit runningExtensions to those whose property extensionId is in the list of extensionIds
  return runningExtensions.filter((extension) => extensionIds.includes(extension.extensionId));
}
