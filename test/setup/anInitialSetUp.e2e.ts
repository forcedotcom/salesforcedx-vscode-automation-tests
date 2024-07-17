/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs';
import { step } from 'mocha-steps';
import { EnvironmentSettings } from '../environmentSettings.ts';
import * as utilities from '../utilities/index.ts';

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
      await utilities.pause(utilities.Duration.seconds(1));
    }
  });

  step('Authorize to Testing Org', async () => {
    const sfdxAuthUrl = String(SFDX_AUTH_URL);
    const authFilePath = 'authFile.txt';

    // create and write in a text file
    fs.writeFileSync(authFilePath, sfdxAuthUrl);

    const authorizeOrg = await utilities.orgLoginSfdxUrl(authFilePath);
    await expect(authorizeOrg.stdout).toContain(
      `Successfully authorized ${devHubUserName} with org ID ${orgId}`
    );

    const setAlias = await utilities.setAlias(devHubAliasName, devHubUserName);
    await expect(setAlias.stdout).toContain(devHubAliasName);
    await expect(setAlias.stdout).toContain(devHubUserName);
    await expect(setAlias.stdout).toContain('true');
  });
});


