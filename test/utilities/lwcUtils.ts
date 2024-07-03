/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { CMD_KEY } from 'wdio-vscode-service/dist/constants';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { getTextEditor, log, pause } from './miscellaneous';
import { getWorkbench } from './workbench';

export async function createLwc(name: string): Promise<void> {
  log('createLwc() - calling browser.getWorkbench()');
  const workbench = await getWorkbench();

  log('createLwc() - Running SFDX: Create Lightning Web Component');
  // Using the Command palette, run SFDX: Create Lightning Web Component.
  const inputBox = await runCommandFromCommandPrompt(
    workbench,
    'SFDX: Create Lightning Web Component',
    1
  );

  log('createLwc() - Set the name of the new component');
  // Set the name of the new component
  await inputBox.setText(name);
  await inputBox.confirm();
  await pause(1);

  log('createLwc() - Select the default directory');
  // Select the default directory (press Enter/Return).
  await inputBox.confirm();
  await pause(3);

  log('createLwc() - Modify js content');
  // Modify js content
  let textEditor = await getTextEditor(workbench, name + '.js');
  const jsText = [
    `import { LightningElement } from 'lwc';`,
    ``,
    `export default class ${name} extends LightningElement {`,
    `\tgreeting = 'World';`,
    `}`
  ].join('\n');
  await textEditor.setText(jsText);
  await textEditor.save();
  await pause(1);

  log('createLwc() - Modify html content');
  log('');
  // Modify html content
  textEditor = await getTextEditor(workbench, name + '.html');
  const htmlText = [
    `<template>`,
    `\t<lightning-card title="${name}" icon-name="custom:custom14">`,
    `\t\t<div class="slds-var-m-around_medium">Hello, {greeting}!</div>`,
    `\t</lightning-card>`,
    `</template>`
  ].join('\n');
  // `\t\t<c-view-source source="lwc/hello" slot="footer">`,
  // `\t\t\tBind an HTML element to a component property.`,
  // `\t\t</c-view-source>`,
  await textEditor.setText(htmlText);
  await textEditor.save();
  await pause(1);

  log('createLwc() - Modify test content');
  log('');
  textEditor = await getTextEditor(workbench, name + '.test.js');
  const nameCapitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const testText = [
    `import { createElement } from 'lwc';`,
    `import ${nameCapitalized} from 'c/${name}';`,
    '',
    `describe('c-${name}', () => {`,
    `    afterEach(() => {`,
    `        while (document.body.firstChild) {`,
    `            document.body.removeChild(document.body.firstChild);`,
    `        }`,
    `    });`,
    ``,
    `    it('displays greeting', () => {`,
    `        const element = createElement('c-${name}', {`,
    `            is: ${nameCapitalized}`,
    `        });`,
    `        document.body.appendChild(element);`,
    `        const div = element.shadowRoot.querySelector('div');`,
    `        expect(div.textContent).toBe('Hello, World!');`,
    `    });`,
    ``,
    `    it('is defined', async () => {`,
    `        const element = createElement('c-${name}', {`,
    `            is: ${nameCapitalized}`,
    `        });`,
    `        document.body.appendChild(element);`,
    `        await expect(element).toBeDefined();`,
    `    });`,
    `});`
  ].join('\n');
  await textEditor.setText(testText);
  await textEditor.save();
  await pause(1);

  // Set breakpoints
  await browser.keys([CMD_KEY, 'f']);
  await pause(1);
  await browser.keys(`expect(div.textContent).toBe('Hello, World!');`);
  await browser.keys(['Escape']);
  await browser.keys(['ArrowRight']);
  await runCommandFromCommandPrompt(workbench, 'Debug: Inline Breakpoint', 2);

  await browser.keys([CMD_KEY, 'f']);
  await pause(1);
  await browser.keys(`await expect(element).toBeDefined();`);
  await browser.keys(['Escape']);
  await browser.keys(['ArrowRight']);
  await runCommandFromCommandPrompt(workbench, 'Debug: Inline Breakpoint', 2);
}

export async function createAura(name: string): Promise<void> {
  log('createAura() - calling browser.getWorkbench()');
  const workbench = await getWorkbench();

  log('createAura() - Running SFDX: Create Aura Component');
  const inputBox = await runCommandFromCommandPrompt(workbench, 'SFDX: Create Aura Component', 1);

  log('createAura() - Set the name of the new component');
  // Set the name of the new component
  await inputBox.setText(name);
  await inputBox.confirm();
  await pause(1);

  log('createAura() - Select the default directory');
  // Select the default directory (press Enter/Return).
  await inputBox.confirm();
  await pause(3);

  log('createAura() - Modify html content');
  // Modify html content
  const textEditor = await getTextEditor(workbench, name + '.cmp');
  const htmlText = [
    '<aura:component>',
    '\t',
    '\t<aura:attribute name="simpleNewContact" type="Object"/>',
    '\t<div class="slds-page-header" role="banner">',
    '\t\t<h1 class="slds-m-right_small">Create New Contact</h1>',
    '\t</div>',
    '\t<aura:if isTrue="{!not(empty(v.simpleNewContact))}">',
    '\t\t{!v.simpleNewContact}',
    '\t</aura:if>',
    '</aura:component>'
  ].join('\n');
  await textEditor.setText(htmlText);
  await textEditor.save();
  await pause(1);
}
