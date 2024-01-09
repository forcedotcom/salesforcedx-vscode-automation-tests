/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import child_process from 'child_process';
import fs from 'fs';
import { step } from 'mocha-steps';
import util from 'util';
import { EnvironmentSettings } from '../environmentSettings';
import * as utilities from '../utilities';

const exec = util.promisify(child_process.exec);

describe('An Initial SetUp', async () => {
  const environmentSettings = EnvironmentSettings.getInstance();
  const devHubUserName = environmentSettings.devHubUserName;
  const devHubAliasName = environmentSettings.devHubAliasName;
  const SFDX_AUTH_URL = environmentSettings.sfdxAuthUrl;
  const orgId = environmentSettings.orgId;

  step('Countdown', async () => {
    utilities.log('About to start authorizing to devhub');
    for (let i = 5; i > 0; i--) {
      utilities.log(`${i}...`);
      await utilities.pause(1);
    }
  });

  step('Authorize to Testing Org', async () => {
    const sfdxAuthUrl = String(SFDX_AUTH_URL);
    const authFilePath = 'authFile.txt';

    // create and write in a text file
    fs.writeFileSync(authFilePath, sfdxAuthUrl);

    // For sfdx -> sf, remove the two lines below this comment block and uncomment the following line instead
    // await exec(`sf org login sfdx-url --sfdx-url-file ${authFilePath} --set-default --alias ${devHubAliasName}`);
    const authorizeOrg = await exec(`sfdx org:login:sfdx-url -d -f ${authFilePath}`);
    expect(authorizeOrg.stdout).toContain(
      `Successfully authorized ${devHubUserName} with org ID ${orgId}`
    );

    const setAlias = await exec(`sfdx alias:set ${devHubAliasName}=${devHubUserName}`);
    expect(setAlias.stdout).toContain(devHubAliasName);
    expect(setAlias.stdout).toContain(devHubUserName);
    expect(setAlias.stdout).toContain('true');
  });
});
