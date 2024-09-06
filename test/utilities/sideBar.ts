/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  DefaultTreeItem,
  TreeItem,
  ViewItem,
  Workbench,
  ViewSection,
  SideBarView
} from 'wdio-vscode-service';
import { Duration, pause } from './miscellaneous.ts';
import { fail } from 'assert';

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
  const visibleItemsLabels = await Promise.all(
    visibleItems.map((item) => item.getLabel().then((label) => label))
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

export async function retrieveExpectedNumTestsFromSidebar(
  expectedNumTests: number,
  testsSection: ViewSection,
  actionLabel: string
): Promise<TreeItem[]> {
  let testsItems = (await testsSection.getVisibleItems()) as TreeItem[];
  await browser.keys(['Escape']);

  // If the tests did not show up, click the refresh button on the top right corner of the Test sidebar
  for (let x = 0; x < 3; x++) {
    if (testsItems.length === 1) {
      await testsSection.elem.click();
      const refreshAction = await testsSection.getAction(actionLabel);
      if (!refreshAction) {
        fail('Could not find debug tests action button');
      }
      await refreshAction.elem.click();
      await pause(Duration.seconds(10));
      testsItems = (await testsSection.getVisibleItems()) as TreeItem[];
    } else if (testsItems.length === expectedNumTests) {
      break;
    }
  }

  return testsItems;
}

export async function getTestsSection(workbench: Workbench, type: string) {
  const sidebar = workbench.getSideBar();
  const sidebarView = sidebar.getContent();
  const testsSection = await sidebarView.getSection(type);
  await expect(testsSection.elem).toBePresent();
  return testsSection;
}

export async function runTestCase(
  workbench: Workbench,
  testSuite: string,
  testName: string,
  actionLabel: string
): Promise<TreeItem> {
  const testingView = await workbench.getActivityBar().getViewControl('Testing');
  await expect(testingView).not.toBeUndefined();

  // Open the Test Sidebar
  const testingSideBarView = await testingView?.openView();
  await expect(testingSideBarView).toBeInstanceOf(SideBarView);
  const testSection = await getTestsSection(workbench, testSuite);
  const testItem = (await testSection.findItem(testName)) as TreeItem;
  await expect(testItem).toBePresent();
  await testItem.select();

  const actionButton = await testItem.getActionButton(actionLabel);
  await expect(actionButton).toBePresent();
  await actionButton?.elem.click();
  return testItem;
}
