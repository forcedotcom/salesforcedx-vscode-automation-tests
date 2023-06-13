/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import child_process from 'child_process';
import fs from 'fs';
import { step } from "mocha-steps";
import util from 'util';
import { EnvironmentSettings } from '../environmentSettings';
import * as utilities from '../utilities';

const exec = util.promisify(child_process.exec);

describe('An Initial SetUp', async () => {
  utilities.log('...AnInitialSetUP begin...');

  // ToDo: test if environment settings is accessible at this point in remote env
  const environmentSettings = EnvironmentSettings.getInstance();
  const devHubUserName = environmentSettings.devHubUserName;
  const devHubAliasName = environmentSettings.devHubAliasName;
  const SFDX_AUTH_URL = environmentSettings.sfdxAuthUrl;
  const orgId = environmentSettings.orgId;
  utilities.log(`${devHubUserName}`);
  utilities.log(`${devHubAliasName}`);
  step('Countdown', async () => {
    utilities.log('About to start the e2e tests...');
    for (let i = 10; i > 0; i--) {
      utilities.log(`${i}...`);
      await utilities.pause(1);
    }
  });

  step('Authorize DevHub', async () => {
    const sfdxAuthUrl = String(SFDX_AUTH_URL);
    const authFilePath = 'authFile.txt';
    utilities.log('...Authorize DevHub...');
    // create and write in a text file
    fs.writeFileSync(authFilePath, sfdxAuthUrl);
    utilities.log(`...Written authFile in  - ${authFilePath}...`);

    await exec(`sfdx auth:sfdxurl:store -f ${authFilePath}`);
    utilities.log(`...Ran auth:sfdxurl:store...`);

    await exec(`sfdx alias set ${devHubAliasName}=${devHubUserName}`);
    // For sfdx -> sf, remove above two lines and keep this
    // await exec(`sf org login sfdx-url --sfdx-url-file ${authFilePath} --set-default --alias ${DEV_HUB_ALIAS_NAME}`);
    utilities.log(`...Set Alias...`);
  });

  step('Verify Connection to Testing Org', async () => {
    const workbench = await browser.getWorkbench();
    const terminalView = await utilities.executeCommand(workbench, `sfdx org list`)
    const terminalText = await utilities.getTerminalViewText(terminalView, 100);
    utilities.log('...Check-start...');
    expect(terminalText).toContain(`${orgId}`);
    expect(terminalText).toContain('Connected');
    expect(terminalText).toContain('Non-scratch orgs');
    expect(terminalText).toContain(`${devHubUserName}`);
    expect(terminalText).toContain(`${devHubAliasName}`);
    utilities.log('...Check-finish...');

  });
});
