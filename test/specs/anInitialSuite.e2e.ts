/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { TestSetup } from '../testSetup';
import * as utilities from '../utilities';

/*
anInitialSuite.e2e.ts is a special case.  We want to validate that the Salesforce extensions and
most SFDX commands are not present at start up.

We also want to verify that after a project has been created, that the Salesforce extensions are loaded,
and that the SFDX commands are present.

Because of this requirement, this suite needs to run first before the other suites.  Since the
suites run in alphabetical order, this suite has been named so it runs first.

Please note that none of the other suites depend on this suite to run, it's just that if this
suite does run, it needs to run first.
*/

describe('An Initial Suite', async () => {
  let testSetup: TestSetup;

  step('Countdown', async () => {
    utilities.log('About to start the e2e tests...');
    for (let i = 10; i > 0; i--) {
      utilities.log(`${i}...`);
      await utilities.pause(1);
    }
  });

  step('Verify our extensions are not initially loaded', async () => {
    utilities.pause(5);
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.showRunningExtensions(workbench);

    const extensionNameDivs = await $$('div.name');
    let sfdxKeywordWasFound = false;
    let salesforceKeywordWasFound = false;
    for (const extensionNameDiv of extensionNameDivs) {
      const text = await extensionNameDiv.getText();
      if (text.includes('sfdx')) {
        sfdxKeywordWasFound = true;
        utilities.log(`AnInitialSuite - extension ${text} was present, but wasn't expected`);
      } else if (text.includes('salesforce')) {
        if (text !== 'salesforce.system-tests') {
          // salesforce.system-tests is expected, anything else is an issue.
          salesforceKeywordWasFound = true;
          utilities.log(
            `AnInitialSuite - extension ${text} was present, but wasn't expected before the extensions loaded`
          );
        }
      }
    }
    expect(sfdxKeywordWasFound).toBe(false);
    expect(salesforceKeywordWasFound).toBe(false);
  });

  step('Verify the default SFDX commands are present when no project is loaded', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    const prompt = await utilities.openCommandPromptWithCommand(workbench, 'SFDX:');

    const quickPicks = await prompt.getQuickPicks();
    let expectedSfdxCommandsFound = 0;
    let unexpectedSfdxCommandWasFound = false;
    for (const quickPick of quickPicks) {
      const label = await quickPick.getLabel();
      switch (label) {
        // These three commands are expected to always be present,
        // even before the extensions have been loaded.
        case 'SFDX: Create and Set Up Project for ISV Debugging':
        case 'SFDX: Create Project':
        case 'SFDX: Create Project with Manifest':
          expectedSfdxCommandsFound++;
          break;

        default:
          // And if any other SFDX commands are present, this is unexpected and is an issue.
          unexpectedSfdxCommandWasFound = true;
          utilities.log(
            `AnInitialSuite - command ${label} was present, but wasn't expected before the extensions loaded`
          );
          break;
      }
    }

    expect(expectedSfdxCommandsFound).toBe(3);
    expect(unexpectedSfdxCommandWasFound).toBe(false);

    // Escape out of the pick list.
    await prompt.cancel();
  });

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('AnInitialSuite', false);
    // Don't call testSetup.setUp() b/c we don't need to authorize a scratch org,
    // just call setUpTestingEnvironment() and createProject().
    await testSetup.setUpTestingEnvironment();
    await testSetup.createProject('Developer');
  });

  step('Verify our extensions are loaded after creating an SFDX project', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    await utilities.runCommandFromCommandPrompt(workbench, 'Developer: Show Running Extensions', 3);
    // Close panel so all extensions can be seen
    await utilities.runCommandFromCommandPrompt(workbench, 'View: Close Panel', 1);

    let matchesFound = 0;
    const extensionNameDivs = await $$('div.name');
    for (const extensionNameDiv of extensionNameDivs) {
      const text = await extensionNameDiv.getText();

      if (text.startsWith('salesforce.salesforcedx-vscode-')) {
        matchesFound++;
        utilities.log(`AnInitialSuite - extension ${text} is loaded`);
      }
    }

    // 7 are in the list, but sometimes only 6 are visible.
    expect(matchesFound).toBeGreaterThanOrEqual(6);
  });

  step('Verify that SFDX commands are present after an SFDX project has been created', async () => {
    const workbench = await (await browser.getWorkbench()).wait();
    const prompt = await utilities.openCommandPromptWithCommand(workbench, 'SFDX:');
    const quickPicks = await prompt.getQuickPicks();
    const commands: string[] = [];
    for (const quickPick of quickPicks) {
      commands.push(await quickPick.getLabel());
    }

    // Look for the first few SFDX commands.
    expect(commands).toContain('SFDX: Add Tests to Apex Test Suite');
    expect(commands).toContain('SFDX: Authorize a Dev Hub');
    expect(commands).toContain('SFDX: Authorize an Org');
    expect(commands).toContain('SFDX: Authorize an Org using Session ID');
    expect(commands).toContain('SFDX: Cancel Active Command');
    expect(commands).toContain('SFDX: Configure Apex Debug Exceptions');
    expect(commands).toContain('SFDX: Create a Default Scratch Org...');
    expect(commands).toContain('SFDX: Create Apex Class');
    expect(commands).toContain('SFDX: Create Apex Test Suite');
    expect(commands).toContain('SFDX: Create Apex Trigger');
    // There are more, but just look for the first few commands.

    // Escape out of the pick list.
    await prompt.cancel();
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
