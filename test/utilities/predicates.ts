/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Duration } from './miscellaneous.ts';

export interface PredicateWithTimeout {
  predicate: () => Promise<boolean>;
  maxWaitTime: Duration; // in milliseconds
}

export const standardPredicates = {
  alwaysTrue: async () => true,
  waitForElement: async (selector: string) => {
    return await browser.$(selector).isDisplayed();
  },
  waitForCondition: async (condition: () => boolean) => {
    while (!condition()) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Adjust polling interval as needed
    }
    return true;
  }
};

export function createPredicateWithTimeout(
  predicate: () => Promise<boolean>,
  maxWaitTime: Duration
): PredicateWithTimeout {
  return {
    predicate,
    maxWaitTime
  };
}
