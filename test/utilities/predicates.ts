export interface PredicateWithTimeout {
  predicate: () => Promise<boolean>;
  maxWaitTime: number; // in milliseconds
}

export const standardPredicates = {
  alwaysTrue: async () => true,
  waitForElement: async (selector: string) => {
    return await browser.$(selector).isDisplayed();
  },
  waitForCondition: async (condition: () => boolean) => {
    while (!condition()) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Adjust polling interval as needed
    }
    return true;
  },
};

export function createPredicateWithTimeout(predicate: () => Promise<boolean>, maxWaitTime: number): PredicateWithTimeout {
  return {
    predicate,
    maxWaitTime,
  };
}
