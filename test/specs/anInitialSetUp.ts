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

const DEV_HUB_USER_NAME = 'svc_idee_bot@salesforce.com';
const DEV_HUB_ALIAS_NAME = 'vscodeOrg';
const ORGID = ''
const SFDXAUTHURL = '';

const exec = util.promisify(child_process.exec);

describe('An Initial SetUp', async () => {
  // ToDo: test if environment settings is accessible at this point in remote env
  const environmentSettings = EnvironmentSettings.getInstance();
  const devHubUserName = environmentSettings.devHubUserName;
  const devHubAliasName = environmentSettings.devHubAliasName;
  utilities.log(`${devHubUserName}`);
  utilities.log(`${devHubAliasName}`);

  step('Authorize DevHub', async () => {
    const sfdxAuthUrl = String(SFDXAUTHURL);
    const authFilePath = 'authFile.txt';
    utilities.log('...Authorize DevHub...');
    // create and write in a text file
    fs.writeFileSync(authFilePath, sfdxAuthUrl);
    utilities.log(`...Written authFile in  - ${authFilePath}...`);

    await exec(`sfdx auth:sfdxurl:store -f ${authFilePath}`);
    utilities.log(`...Ran auth:sfdxurl:store...`);

    await exec(`sfdx alias set ${DEV_HUB_ALIAS_NAME}=${DEV_HUB_USER_NAME}`);
    // For sfdx -> sf, remove above two lines and keep this
    // await exec(`sf org login sfdx-url --sfdx-url-file ${authFilePath} --set-default --alias ${DEV_HUB_ALIAS_NAME}`);
    utilities.log(`...Set Alias...`);
  });

  step('Verify Connection to Testing Org', async () => {
    const workbench = await browser.getWorkbench();
    const terminalView = await utilities.executeCommand(workbench, `sfdx org list`)
    const terminalText = await utilities.getTerminalViewText(terminalView, 100);
    utilities.log('...Check-start...');
    expect(terminalText).toContain(`${ORGID}`);
    expect(terminalText).toContain('Connected');
    expect(terminalText).toContain('Non-scratch orgs');
    expect(terminalText).toContain(`${DEV_HUB_USER_NAME}`);
    expect(terminalText).toContain(`${DEV_HUB_ALIAS_NAME}`);
    utilities.log('...Check-finish...');

  });
});
