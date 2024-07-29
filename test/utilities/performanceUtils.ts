/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { executeQuickPick } from "./commandPrompt.ts";
import { Duration } from "./miscellaneous.ts";

export async function openStartupPerformance(wait = Duration.seconds(1)) {
  await executeQuickPick('Developer: Startup Performance', wait);
}
