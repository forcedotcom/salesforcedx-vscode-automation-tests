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

  step('Install extensions', async () => {
    await utilities.installExtensions();
    await utilities.reloadAndEnableExtensions();
  });

  step('Verify our extensions are not initially loaded', async () => {
    await utilities.showRunningExtensions();
    await utilities.zoom('Out', 4, 1);

    const foundSfExtensions = await utilities.findExtensionsInRunningExtensionsList(
      utilities.getExtensionsToVerifyActive().map((ext) => ext.extensionId)
    );
    await utilities.zoomReset();
    if (foundSfExtensions.length > 0) {
      foundSfExtensions.forEach((ext) => {
        utilities.log(
          `AnInitialSuite - extension ${ext.extensionId} was present, but wasn't expected before the extensions loaded`
        );
      });
      throw new Error('AnInitialSuite - extension was found before the extensions loaded');
    }
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
        case 'SLDS: Do not scope SLDS Validator to SFDX project files':
        case 'SLDS: Scope SLDS Validator to run for SFDX project files':
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

    expect(expectedSfdxCommandsFound).toBe(5);
    expect(unexpectedSfdxCommandWasFound).toBe(false);

    // Escape out of the pick list.
    await prompt.cancel();
  });

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('AnInitialSuite', false);
    // Don't call testSetup.setUp() b/c we don't need to authorize a scratch org,
    // just call setUpTestingEnvironment() and createProject().
    await testSetup.setUpTestingEnvironment();
    await testSetup.createProject('developer');
    await utilities.reloadAndEnableExtensions();
  });

  step('Verify our extensions are loaded after creating an SFDX project', async () => {
    await utilities.verifyExtensionsAreRunning(utilities.getExtensionsToVerifyActive());
    browser.keys(['Escape']);
    await utilities.pause(1);
    browser.keys(['Escape']);
    await utilities.pause(1);
  });

  step('Verify that SFDX commands are present after an SFDX project has been created', async () => {
    const workbench = await utilities.getWorkbench();
    await utilities.enableAllExtensions();
    await utilities.executeQuickPick('Extensions: Show Enabled Extensions', 2);
    const prompt = await utilities.openCommandPromptWithCommand(workbench, 'SFDX:');
    const quickPicks = await prompt.getQuickPicks();
    const commands = await Promise.all(quickPicks.map((quickPick) => quickPick.getLabel()));

    // Look for the first few SFDX commands.
    expect(commands).toContain('SFDX: Create Project');
    expect(commands).toContain('SFDX: Authorize a Dev Hub');
    expect(commands).toContain('SFDX: Authorize an Org');
    expect(commands).toContain('SFDX: Authorize an Org using Session ID');
    expect(commands).toContain('SFDX: Cancel Active Command');
    expect(commands).toContain('SFDX: Configure Apex Debug Exceptions');
    expect(commands).toContain('SFDX: Create a Default Scratch Org...');
    expect(commands).toContain('SFDX: Create and Set Up Project for ISV Debugging');
    expect(commands).toContain('SFDX: Create Apex Class');
    expect(commands).toContain('SFDX: Create Apex Trigger');
    // There are more, but just look for the first few commands.

    // Escape out of the pick list.
    await prompt.cancel();
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
