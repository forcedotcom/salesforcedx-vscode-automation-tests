/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TextEditor } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { log, pause } from './miscellaneous';

export async function enableLWCExtension(): Promise<void> {
  // salesforce.salesforcedx-vscode-lwc extension is actually not loading automatically
  // because it depends on ESLint and it's not installed by default, so we need to
  // Install it, reload and enable extensions to get them both running
  log('enableLWCExtension() - calling browser.getWorkbench()');
  const workbench = await browser.getWorkbench();

  log('enableLWCExtension() - getting buttons with selector');
  let buttons = await $$('a.monaco-button.monaco-text-button');
  for (const item of buttons) {
    const text = await item.getText();
    if (text.includes('Install and Reload')) {
      log('enableLWCExtension() - Install and Reload');
      await item.click();
      return;
    }
  }
  await pause(10);

  log('enableLWCExtension() - getting buttons after reloading with selector');
  buttons = await $$('a.monaco-button.monaco-text-button');
  for (const item of buttons) {
    const text = await item.getText();
    if (text.includes('Reload and Enable Extensions')) {
      log('enableLWCExtension() - Reload and Enable Extensions');
      await item.click();
      return;
    }
  }
  await pause(5);

  log('enableLWCExtension() - Running Developer: Reload Window');
  await runCommandFromCommandPrompt(workbench, 'Developer: Reload Window', 10);
}

export async function createLWC(name: string): Promise<void> {
  log('createLWC() - calling browser.getWorkbench()');
  const workbench = await browser.getWorkbench();

  log(`createLWC() - Running SFDX: Create Lightning Web Component`);
  // Using the Command palette, run SFDX: Create Lightning Web Component.
  let inputBox = await runCommandFromCommandPrompt(
    workbench,
    'SFDX: Create Lightning Web Component',
    1
  );

  log(`createLWC() - Set the name of the new component`);
  // Set the name of the new component
  await inputBox.setText(name);
  await inputBox.confirm();
  await pause(1);

  log(`createLWC() - Select the default directory`);
  // Select the default directory (press Enter/Return).
  await inputBox.confirm();
  await pause(3);

  log(`createLWC() - Modify js content`);
  // Modify js content
  const editorView = workbench.getEditorView();
  let textEditor = (await editorView.openEditor(name + '.js')) as TextEditor;
  const jsText = [
    `import { LightningElement } from 'lwc';`,
    ``,
    `export default class ${name} extends LightningElement {`,
    ` greeting = 'World';`,
    `}`
  ].join('\n');
  await textEditor.setText(jsText);
  await textEditor.save();
  await pause(1);

  log(`createLWC() - Modify html content`);
  // Modify html content
  inputBox = await runCommandFromCommandPrompt(workbench, 'Go to File...', 1);
  await inputBox.setText(name + '.html');
  await inputBox.confirm();
  await pause(1);

  const htmlText = [
    `<template>`,
    ` <lightning-card title="${name}" icon-name="custom:custom14">`,
    `   <div class="slds-var-m-around_medium">Hello, {greeting}!</div>`,
    `   <c-view-source source="lwc/hello" slot="footer">`,
    `     Bind an HTML element to a component property.`,
    `   </c-view-source>`,
    ` </lightning-card>`,
    `</template>`
  ].join('\n');
  await textEditor.setText(htmlText);
  await textEditor.save();
  await pause(1);
}

export async function createAura(name: string): Promise<void> {
  log('createAura() - calling browser.getWorkbench()');
  const workbench = await browser.getWorkbench();

  log(`createAura() - Running SFDX: Create Aura Component`);
  let inputBox = await runCommandFromCommandPrompt(
    workbench,
    'SFDX: Create Aura Component',
    1
  );

  log(`createAura() - Set the name of the new component`);
  // Set the name of the new component
  await inputBox.setText(name);
  await inputBox.confirm();
  await pause(1);

  log(`createAura() - Select the default directory`);
  // Select the default directory (press Enter/Return).
  await inputBox.confirm();
  await pause(3);

  log(`createAura() - Modify html content`);
  // Modify html content
  const editorView = workbench.getEditorView();
  let textEditor = (await editorView.openEditor(name + '.cmp')) as TextEditor;
  const htmlText = [
    '<aura:component>',
    ' ',
    ' <aura:attribute name="simpleNewContact" type="Object"/>',
    ' <div class="slds-page-header" role="banner">',
    '   <h1 class="slds-m-right_small">Create New Contact</h1>',
    ' </div>',
    ' <aura:if isTrue="{!not(empty(v.simpleNewContact))}">',
    '   {!v.simpleNewContact}',
    ' </aura:if>',
    '</aura:component>'
  ].join('\n');
  await textEditor.setText(htmlText);
  await textEditor.save();
  await pause(1);
}
