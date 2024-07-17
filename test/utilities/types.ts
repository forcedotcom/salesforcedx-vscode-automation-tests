/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type OrgEdition = 'developer' | 'enterprise';

export type SfCommandRunResults = {
  stdout: string;
  stderr: string;
  exitCode: number;
};
