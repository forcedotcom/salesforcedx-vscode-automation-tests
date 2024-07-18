/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import * as utilities from '../utilities/index.ts';

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
  step('Test Settings', async () => {
    await utilities.disableBooleanSetting(
      'editor.find.addExtraSpaceOnTop',
      utilities.Duration.seconds(5),
      'user'
    );
    await utilities.pause(utilities.Duration.seconds(5));
    await utilities.enableBooleanSetting(
      'editor.find.addExtraSpaceOnTop',
      utilities.Duration.seconds(5),
      'user'
    );
    await utilities.pause(utilities.Duration.seconds(5));
  });
});
