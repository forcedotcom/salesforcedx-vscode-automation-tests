/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { DefaultTreeItem, TreeItem, ViewItem, Workbench, ViewSection } from 'wdio-vscode-service';
import { pause } from './miscellaneous';

export async function expandSideBar(
  workbench: Workbench,
  projectName: string
): Promise<ViewSection> {
  const sidebar = workbench.getSideBar();
  const treeViewSection = await sidebar.getContent().getSection(projectName);
  await treeViewSection.expand();
  return treeViewSection;
}

export async function getVisibleItemsFromSidebar(workbench: Workbench, projectName: string) {
  const treeViewSection = await expandSideBar(workbench, projectName);

  // Warning, we can only retrieve the items which are visible.
  const visibleItems = (await treeViewSection.getVisibleItems()) as DefaultTreeItem[];
  const visibleItemsLabels = await visibleItems.reduce(
    async (previousPromise: Promise<string[]>, currentItem: DefaultTreeItem) => {
      const results = await previousPromise;
      const label = await currentItem.getLabel();
      results.push(label);

      return results;
    },
    Promise.resolve([])
  );

  return visibleItemsLabels;
}

export async function getFilteredVisibleTreeViewItems(
  workbench: Workbench,
  projectName: string,
  searchString: string
): Promise<DefaultTreeItem[]> {
  const treeViewSection = await expandSideBar(workbench, projectName);

  // Warning, we can only retrieve the items which are visible.
  const visibleItems = (await treeViewSection.getVisibleItems()) as DefaultTreeItem[];
  const filteredItems = await visibleItems.reduce(
    async (previousPromise: Promise<DefaultTreeItem[]>, currentItem: DefaultTreeItem) => {
      const results = await previousPromise;
      const label = await currentItem.getLabel();
      if (label.startsWith(searchString)) {
        results.push(currentItem);
      }

      return results;
    },
    Promise.resolve([])
  );

  return filteredItems;
}

// It's a tree, but it's also a list.  Everything in the view is actually flat
// and returned from the call to visibleItems.reduce().
export async function getFilteredVisibleTreeViewItemLabels(
  workbench: Workbench,
  projectName: string,
  searchString: string
): Promise<string[]> {
  const treeViewSection = await expandSideBar(workbench, projectName);

  // Warning, we can only retrieve the items which are visible.
  const visibleItems = (await treeViewSection.getVisibleItems()) as DefaultTreeItem[];
  const filteredItems = (await visibleItems.reduce(
    async (previousPromise: Promise<string[]>, currentItem: ViewItem) => {
      const results = await previousPromise;
      const label = await (currentItem as TreeItem).getLabel();
      if (label.startsWith(searchString)) {
        results.push(label);
      }

      return results;
    },
    Promise.resolve([])
  )) as string[];

  return filteredItems;
}

// There is a bug in DefaultTreeItem.findChildItem().
// When possible, use DefaultTreeItem.findChildItem() but if this doesn't work on
// everyone's machine, use getVisibleChild() instead.
export async function getVisibleChild(
  defaultTreeItem: DefaultTreeItem,
  name: string
): Promise<TreeItem | undefined> {
  const children = await getVisibleChildren(defaultTreeItem);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const label = await child.getLabel();
    if (label === name) {
      return child;
    }
  }

  return undefined;
}

// Replicate DefaultTreeItem.getChildren()
// getVisibleChildren() is very much like DefaultTreeItem.getChildren(), except it calls
// getVisibleItems().
export async function getVisibleChildren(defaultTreeItem: DefaultTreeItem): Promise<TreeItem[]> {
  const rows = await getVisibleItems(
    defaultTreeItem,
    defaultTreeItem.locatorMap.DefaultTreeSection.itemRow as string
  );

  const items = await Promise.all(
    rows.map(async (row) =>
      new DefaultTreeItem(
        defaultTreeItem.locatorMap,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        row as any,
        defaultTreeItem.viewPart
      ).wait()
    )
  );

  return items;
}

// Replicate TreeItem.getChildItems()
// This function returns a list of all visible items within the tree, and not just the children of a node.
export async function getVisibleItems(
  treeItem: TreeItem,
  locator: string
): Promise<WebdriverIO.Element[]> {
  await treeItem.expand();
  const rows = await treeItem.parent.$$(locator);

  return [...rows.values()];
}

export async function retrieveAllApexTestItemsFromSidebar(
  expectedNumTests: number,
  apexTestsSection: ViewSection
): Promise<TreeItem[]> {
  let apexTestsItems = (await apexTestsSection.getVisibleItems()) as TreeItem[];
  await browser.keys(['Escape']);

  // If the Apex tests did not show up, click the refresh button on the top right corner of the Test sidebar
  for (let x = 0; x < 3; x++) {
    if (apexTestsItems.length === 1) {
      await apexTestsSection.elem.click();
      const refreshAction = await apexTestsSection.getAction('Refresh Tests');
      await refreshAction!.elem.click();
      pause(10);
      apexTestsItems = (await apexTestsSection.getVisibleItems()) as TreeItem[];
    } else if (apexTestsItems.length === expectedNumTests) {
      break;
    }
  }

  return apexTestsItems;
}
