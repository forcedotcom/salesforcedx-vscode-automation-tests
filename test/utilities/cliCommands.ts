import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { debug, log } from './miscellaneous.ts';
import { OrgEdition, SfCommandRunResults } from './types.ts';

export type NONE = 'NONE'

export async function runCliCommand(
  command: string,
  ...args: (string | SpawnOptionsWithoutStdio)[]
): Promise<SfCommandRunResults> {
  const commandArgs = args.filter((arg) => typeof arg === 'string');
  const hadJsonFlag = commandArgs.some((arg) => arg === '--json');
  let options = args.find((arg) => typeof arg !== 'string') as SpawnOptionsWithoutStdio;
  let message = `running CLI command ${command} ${commandArgs.join(' ')}`;
  if (options) {
    message += `\nspawn options: ${JSON.stringify(options)}`;
  }
  log(message);
  // add NODE_ENV=production
  options = { ...(options ?? {}), ...{ NODE_ENV: 'production' } };

  return new Promise((resolve, reject) => {
    const sfProcess = spawn('sf', [command, ...commandArgs] as string[], options);

    let stdout = '';
    let stderr = '';

    sfProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    sfProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    sfProcess.on('close', (code) => {
      // Post-command processing
      const result: SfCommandRunResults = { stdout, stderr, exitCode: code ?? 0 };
      result.stdout = hadJsonFlag ? removeEscapedCharacters(result.stdout) : result.stdout;
      // Perform any necessary post-processing here
      // For example, you can modify the result object or log additional information
      log(`Command finished with exit code ${result.exitCode}`);
      resolve(result);
    });

    sfProcess.on('error', (err) => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });
  });
}

export async function deleteScratchOrg(
  orgAliasName: string | undefined,
  reuseScratchOrg: boolean
): Promise<void> {
  if (orgAliasName && !reuseScratchOrg) {
    // The Terminal view can be a bit unreliable, so directly call exec() instead:
    const sfOrgDeleteResults = await runCliCommand(
      'org:delete:scratch',
      '--target-org',
      orgAliasName,
      '--no-prompt'
    );
    if (sfOrgDeleteResults.exitCode > 0) {
      log(
        `deleteScratchOrg for org ${orgAliasName} failed with exit code ${sfOrgDeleteResults.exitCode}.\nRaw stderr ${sfOrgDeleteResults.stderr}.`
      );
    }
  }
}

export async function orgLoginSfdxUrl(
  username: string,
  authFilePath: string
): Promise<SfCommandRunResults> {
  const sfSfdxUrlStoreResult = await runCliCommand('org:login:sfdx-url', '-d', '-f', authFilePath);
  if (
    sfSfdxUrlStoreResult.exitCode > 0 ||
    !sfSfdxUrlStoreResult.stdout.includes(`Successfully authorized ${username} with org ID`)
  ) {
    debug('sfSfdxUrlStoreResult.exitCode = ' + sfSfdxUrlStoreResult.exitCode);
    debug('sfSfdxUrlStoreResult.stdout = ' + sfSfdxUrlStoreResult.stdout);
    throw new Error(
      `orgLoginSfdxUrl failed with exit code ${sfSfdxUrlStoreResult.exitCode}\nRaw stderr: ${sfSfdxUrlStoreResult.stderr}\nRaw stdout: ${sfSfdxUrlStoreResult.stdout}`
    );
  }
  debug(`orgLoginSfdxUrl results ${JSON.stringify(sfSfdxUrlStoreResult)}`);
  return sfSfdxUrlStoreResult;
}

export async function orgDisplay(usernameOrAlias: string): Promise<SfCommandRunResults> {
  const sfOrgDisplayResult = await runCliCommand(
    'org:display',
    '--target-org',
    usernameOrAlias,
    '--verbose',
    '--json'
  );
  if (sfOrgDisplayResult.exitCode > 0) {
    const message = `sf org display failed with exit code: ${sfOrgDisplayResult.exitCode}.\n${sfOrgDisplayResult.stderr}`;
    log(message);
    throw new Error(message);
  }
  debug(`orgDisplay results ${JSON.stringify(sfOrgDisplayResult)}`);
  return sfOrgDisplayResult;
}

export async function orgList(): Promise<SfCommandRunResults> {
  const sfOrgListResult = await runCliCommand('org:list', '--json');
  if (sfOrgListResult.exitCode > 0) {
    const message = `org list failed with exit code ${sfOrgListResult.exitCode}\n stderr ${sfOrgListResult.stderr}`;
    log(message);
    throw new Error(message);
  }
  debug(`orgList results ${JSON.stringify(sfOrgListResult)}`);
  return sfOrgListResult;
}

export async function scratchOrgCreate(
  edition: OrgEdition,
  definitionFileOrNone: string | NONE,
  scratchOrgAliasName: string,
  durationDays: number
): Promise<SfCommandRunResults> {
  log('calling "sf org:create:scratch"...');
  const args = [
    '--edition',
    edition,
    '--alias',
    scratchOrgAliasName,
    '--duration-days',
    durationDays.toString(),
    '--set-default',
    '--json',
    ...(definitionFileOrNone !== 'NONE' ? ['--definition-file', definitionFileOrNone] : [])
  ];

  const sfOrgCreateResult = await runCliCommand('org:create:scratch', ...args);

  if (sfOrgCreateResult.exitCode > 0) {
    log(
      `create scratch org failed. Exit code: ${sfOrgCreateResult.exitCode}. \ncreate scratch org failed. Raw stderr: ${sfOrgCreateResult.stderr}`
    );
    throw new Error(sfOrgCreateResult.stderr);
  }

  log(`..."sf org:create:scratch" finished`);
  debug(`scratchOrgCreate results ${JSON.stringify(sfOrgCreateResult)}`);

  return sfOrgCreateResult;
}

export async function setAlias(
  devHubAliasName: string,
  devHubUserName: string
): Promise<SfCommandRunResults> {
  const setAliasResult = await runCliCommand('alias:set', `${devHubAliasName}=${devHubUserName}`);
  if (setAliasResult.exitCode > 0) {
    log(
      `alias failed. Exit code: ${setAliasResult.exitCode}. \nRaw stderr: ${setAliasResult.stderr}`
    );
    throw new Error(setAliasResult.stderr);
  }
  return setAliasResult;
}

export async function installJestUTToolsForLwc(projectFolder: string | undefined) {
  if (!projectFolder) {
    throw new Error('cannot setup lwc tests without a project folder.');
  }

  const jestInstallResult = await runCliCommand('force:lightning:lwc:test:setup', {
    cwd: projectFolder
  });

  if (jestInstallResult.exitCode > 0) {
    log(
      `setup lwc tests failed. Exit code: ${jestInstallResult.exitCode}. \nRaw stderr: ${jestInstallResult.stderr}`
    );
    throw new Error(jestInstallResult.stderr);
  }
  return jestInstallResult;
}

export async function createUser(
  systemAdminUserDefPath: string,
  targetOrg: string | undefined
): Promise<SfCommandRunResults> {
  if (!targetOrg) {
    throw new Error('cannot create user with target');
  }
  const sfOrgCreateUserResult = await runCliCommand(
    'org:create:user',
    '--definition-file',
    systemAdminUserDefPath,
    '--target-org',
    targetOrg
  );
  if (sfOrgCreateUserResult.exitCode > 0) {
    log(
      `org create user failed Exit code: ${sfOrgCreateUserResult.exitCode}. \nRaw stderr: ${sfOrgCreateUserResult.stderr}`
    );
    throw new Error(sfOrgCreateUserResult.stderr);
  }
  debug(`createUser results ${JSON.stringify(sfOrgCreateUserResult)}`);
  return sfOrgCreateUserResult;
}

export function removeEscapedCharacters(result: string): string {
  const resultJson = result.replace(/\u001B\[\d\dm/g, '').replace(/\\n/g, '');

  return resultJson;
}
