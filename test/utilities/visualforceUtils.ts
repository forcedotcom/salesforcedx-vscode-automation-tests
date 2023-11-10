/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TextEditor } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { getTextEditor, pause } from './miscellaneous';

export async function createVisualforcePage(): Promise<void> {
  const workbench = await browser.getWorkbench();

  // Using the Command palette, run SFDX: Create Visualforce Page
  let inputBox = await runCommandFromCommandPrompt(workbench, 'SFDX: Create Visualforce Page', 1);

  // Set the name of the new Visualforce Page
  await inputBox.setText('FooPage');
  await inputBox.confirm();

  // Select the default directory (press Enter/Return).
  await inputBox.confirm();
  await pause(1);

  // Modify page content
  const textEditor = await getTextEditor(workbench, 'FooPage.page');
  const pageText = [
    `<apex:page controller="myController" tabStyle="Account">`,
    `\t<apex:form>`,
    `\t`,
    `\t\t<apex:pageBlock title="Congratulations {!$User.FirstName}">`,
    `\t\t\tYou belong to Account Name: <apex:inputField value="{!account.name}"/>`,
    `\t\t\t<apex:commandButton action="{!save}" value="save"/>`,
    `\t\t</apex:pageBlock>`,
    `\t</apex:form>`,
    `</apex:page>`
  ].join('\n');
  await textEditor.setText(pageText);
  await textEditor.save();
  await pause(1);
}
