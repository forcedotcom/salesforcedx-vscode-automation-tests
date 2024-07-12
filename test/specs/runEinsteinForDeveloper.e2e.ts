/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { SideBarView } from 'wdio-vscode-service';
import { TestSetup } from '../testSetup.ts';

describe('Run Einstein for Developer Tests', async () => {
  let testSetup: TestSetup;

  step('Set up the testing environment', async () => {
    testSetup = new TestSetup('RunEinsteinForDeveloperTests', true);
    await testSetup.setUp();
  });

  step('Run Einstein Sidebar tests', async () => {
    // Open the Einstein Sidebar
    const workbench = await (await browser.getWorkbench()).wait();
    const testingView = await workbench.getActivityBar().getViewControl('Einstein Sidebar');
    const testingSideBarView = await testingView?.openView();
    await expect(testingSideBarView).toBeInstanceOf(SideBarView);

    const sidebar = workbench.getSideBar();
    const sidebarView = sidebar.getContent();
    await expect(sidebarView.elem).toBePresent();

    // Verify if an element is present within the sidebar view
    const sidebarElems = await sidebarView.elem;
    const isElemPresent = await sidebarElems.isExisting();
    await expect(isElemPresent).toBe(true);

    //TODO: fix control xpath
    // const question_txt = await $('vscode-text-area#question');
    // const question_txt = await browser.$('vscode-text-area#question');
    // const question_txt = (await sidebarElem.$('textarea#control'))

    // const defaultText = await question_txt.getText();
    // Verify the default text
    // await expect(defaultText).toContain('Write a question or instruction here...');

    // Set question in the text area
    // await question_txt.setValue('write a trigger for an account');

    // TODO: fix button xpath
    // const ask_btn = await $('vscode-button#ask');
    // ask_btn.click();
  });

  step('Tear down and clean up the testing environment', async () => {
    await testSetup.tearDown();
  });
});
