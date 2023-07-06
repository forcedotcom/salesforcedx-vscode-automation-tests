/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TextEditor } from 'wdio-vscode-service';
import { runCommandFromCommandPrompt } from './commandPrompt';
import { pause } from './miscellaneous';

export async function createApexClass(
  name: string,
  classText: string,
  breakpoint?: number
): Promise<void> {
  const workbench = await browser.getWorkbench();

  // Using the Command palette, run SFDX: Create Apex Class to create the main class
  const inputBox = await runCommandFromCommandPrompt(workbench, 'SFDX: Create Apex Class', 1);

  // Set the name of the new Apex Class
  await inputBox.setText(name);
  await inputBox.confirm();

  // Select the default directory (press Enter/Return).
  await inputBox.confirm();
  await pause(1);

  // Modify class content
  const editorView = workbench.getEditorView();
  const textEditor = (await editorView.openEditor(name + '.cls')) as TextEditor;
  await textEditor.setText(classText);
  await textEditor.save();
  if (breakpoint) {
    await textEditor.toggleBreakpoint(breakpoint);
  }
  await pause(1);
}

export async function createApexClassWithTest(name: string): Promise<void> {
  const classText = [
    `public with sharing class ${name} {`,
    `\tpublic static void SayHello(string name){`,
    `\t\tSystem.debug('Hello, ' + name + '!');`,
    `\t}`,
    `}`
  ].join('\n');
  await createApexClass(name, classText, 3);

  const testText = [
    `@IsTest`,
    `public class ${name}Test {`,
    `\t@IsTest`,
    `\tstatic void validateSayHello() {`,
    `\t\tSystem.debug('Starting validate');`,
    `\t\t${name}.SayHello('Cody');`,
    ``,
    `\t\tSystem.assertEquals(1, 1, 'all good');`,
    `\t}`,
    `}`
  ].join('\n');
  await createApexClass(name + 'Test', testText, 6);
}

export async function createApexClassWithBugs(): Promise<void> {
  const classText = [
    `public with sharing class AccountService {`,
    `\tpublic Account createAccount(String accountName, String accountNumber, String tickerSymbol) {`,
    `\t\tAccount newAcct = new Account(`,
    `\t\t\tName = accountName,`,
    `\t\t\tAccountNumber = accountNumber,`,
    `\t\t\tTickerSymbol = accountNumber`,
    `\t\t);`,
    `\t\treturn newAcct;`,
    `\t}`,
    `}`
  ].join('\n');
  // Using the Command palette, run SFDX: Create Apex Class to create the main class
  await createApexClass('AccountService', classText);

  const testText = [
    `@IsTest`,
    `private class AccountServiceTest {`,
    `\t@IsTest`,
    `\tstatic void should_create_account() {`,
    `\t\tString acctName = 'Salesforce';`,
    `\t\tString acctNumber = 'SFDC';`,
    `\t\tString tickerSymbol = 'CRM';`,
    `\t\tTest.startTest();`,
    `\t\tAccountService service = new AccountService();`,
    `\t\tAccount newAcct = service.createAccount(acctName, acctNumber, tickerSymbol);`,
    `\t\tinsert newAcct;`,
    `\t\tTest.stopTest();`,
    `\t\tList<Account> accts = [ SELECT Id, Name, AccountNumber, TickerSymbol FROM Account WHERE Id = :newAcct.Id ];`,
    `\t\tSystem.assertEquals(1, accts.size(), 'should have found new account');`,
    `\t\tSystem.assertEquals(acctName, accts[0].Name, 'incorrect name');`,
    `\t\tSystem.assertEquals(acctNumber, accts[0].AccountNumber, 'incorrect account number');`,
    `\t\tSystem.assertEquals(tickerSymbol, accts[0].TickerSymbol, 'incorrect ticker symbol');`,
    `\t}`,
    `}`
  ].join('\n');
  // Using the Command palette, run SFDX: Create Apex Class to create the Test
  await createApexClass('AccountServiceTest', testText);
}

export async function createAnonymousApexFile(): Promise<void> {
  const workbench = await browser.getWorkbench();
  const editorView = workbench.getEditorView();

  // Using the Command palette, run File: New File...
  const inputBox = await runCommandFromCommandPrompt(workbench, 'Create: New File...', 1);

  // Set the name of the new Anonymous Apex file
  await inputBox.setText('Anonymous.apex');
  await inputBox.confirm();
  await inputBox.confirm();
  const textEditor = (await editorView.openEditor('Anonymous.apex')) as TextEditor;

  await textEditor.setText("System.debug('¡Hola mundo!');");
  await textEditor.save();
  await pause(1);
}

export async function createApexController(): Promise<void> {
  // Using the Command palette, run SFDX: Create Apex Class to create the controller
  const classText = [
    `public class MyController {`,
    `\tprivate final Account account;`,
    `\tpublic MyController() {`,
    `\t\taccount = [SELECT Id, Name, Phone, Site FROM Account `,
    `\t\tWHERE Id = :ApexPages.currentPage().getParameters().get('id')];`,
    `\t}`,
    `\tpublic Account getAccount() {`,
    `\t\treturn account;`,
    `\t}`,
    `\tpublic PageReference save() {`,
    `\t\tupdate account;`,
    `\t\treturn null;`,
    `\t}`,
    `}`
  ].join('\n');
  await createApexClass('MyController', classText);
}
