/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  step
} from 'mocha-steps';
import {
  TextEditor
} from 'wdio-vscode-service';
import {
  ScratchOrg
} from '../scratchOrg';
import * as utilities from '../utilities';

describe('Push and Pull', async () => {
  let scratchOrg: ScratchOrg;
  let projectName: string;

  step('Set up the testing environment', async () => {
    scratchOrg = new ScratchOrg('PushAndPull', false);
    await scratchOrg.setUp();
    projectName = scratchOrg.tempProjectName.toUpperCase();
  });

  step('Create an Apex class', async () => {
    // Create an Apex Class.
    const workbench = await browser.getWorkbench();
    const inputBox = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Create Apex Class', 1);

    // Set the name of the new component to ExampleApexClass1.
    await inputBox.setText('ExampleApexClass1');
    await inputBox.confirm();
    await utilities.pause(1);

    // Select the default directory (press Enter/Return).
    await inputBox.confirm();

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Create Apex Class successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'Finished SFDX: Create Apex Class', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('create force-app/main/default/classes/ExampleApexClass1.cls');
    expect(outputPanelText).toContain('create force-app/main/default/classes/ExampleApexClass1.cls-meta.xml');

    // Check for expected items in the Explorer view.
    const sidebar = workbench.getSideBar();
    const treeViewSection = await sidebar.getContent().getSection(projectName);
    await treeViewSection.expand();

    // Get the matching (visible) items within the tree which contain "ExampleApexClass1".
    const filteredTreeViewItems = await utilities.getFilteredVisibleTreeViewItemLabels(workbench, projectName, 'ExampleApexClass1');

    // It's a tree, but it's also a list.  Everything in the view is actually flat
    // and returned from the call to visibleItems.reduce().
    expect(filteredTreeViewItems.includes('ExampleApexClass1.cls')).toBe(true);
    expect(filteredTreeViewItems.includes('ExampleApexClass1.cls-meta.xml')).toBe(true);
  });

  step('Push the Apex class', async () => {
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    // At this point there should be no conflicts since this is a new class.

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('Created  ExampleApexClass1  ApexClass');
  });

  step('Push again (with no changes)', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Pushed Source\nNo results found');
  });

  step('Modify the file and push the changes', async () => {
    // Clear the Output view first.
    const outputView = await utilities.openOutputView();
    await outputView.clearText();

    // Modify the file by adding a comment.
    const workbench = await browser.getWorkbench();
    const editorView = await workbench.getEditorView();
    const textEditor = await editorView.openEditor('ExampleApexClass1.cls') as TextEditor;
    await textEditor.setTextAtLine(3, '        // sample comment');

    // Push the file.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    let successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    let outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('=== Pushed Source\nNo results found');

    // Clear the Output view again.
    await outputView.clearText();

    // Now save the file.
    await textEditor.save();


    // An now push the changes.
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);

    successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);

    // Check the output.
    outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', '=== Pushed Source', 10);
    expect(outputPanelText).not.toBeUndefined();
    expect(outputPanelText).toContain('ended with exit code 0');
    expect(outputPanelText).toContain('Changed  ExampleApexClass1  ApexClass');
    expect(outputPanelText).toContain('/e2e-temp/TempProject-PushAndPull/force-app/main/default/classes/ExampleApexClass1.cls');
    expect(outputPanelText).toContain('/e2e-temp/TempProject-PushAndPull/force-app/main/default/classes/ExampleApexClass1.cls-meta.xml');
  });


  /*
  issue: conflict detection on push
  I can only make changes in VS Code
  If I...
    create an Apex class
    push
    make a change
    save
    and then push
      ...I don't get any errors or messages about conflicts

  On the other hand, if I...
    (manually) open the scratch org (sfdx force:org:open)
    make a change to the class
    go back to VSC
    make a (different) change to the class
    save
    and then push
      ...I get messages about conflicts
        ...but this involves leaving VSC in order to perform this



  issue: conflict detection on pull
  If I...
    create an Apex class
    push
    make a change
    save
    and then pull
      ...I don't get any errors or messages about conflicts

  */




  step('Detect conflict when pushing', async () => {

    debugger;

    // go into settings
    // navigate to Extensions > Salesforce Core Configuration
    // "Detect Conflicts At Sync" should be off
    // Turn the option on


    // Make a change to the source
    // Save
    // Push
    // should there be a conflict?
    // I'm not getting a prompt to override
// !!!


    // * Set up the test so that conflicts exist locally and on the server (one file has been modified in both places)
    // Make a modification to the class




    // Run “SFDX: Push Source from Default Scratch Org”
    //     * Verify that the operation failed due to conflicts

  });


  step('Push source to the default scratch org and override conflicts', async () => {

    // debugger;

    // * Run  “SFDX: Push Source from Default Scratch Org and Override Conflicts”
    //     * Verify that the operation succeeded by either:
    //         * querying the org? (did the local change get deployed?)
    //         * inspecting the deploy/retrieve result?
    //         * Verifying the command execution output on the Output view on vscode?


  });



  step('Open command palette and run “SFDX: Pull Source from Default Scratch Org”', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });


  // SFDX: Push Source to Default Scratch Org and Override Conflicts



  // SFDX: Pull Source to Default Scratch Org and Override Conflicts



  step('Open command palette and run “SFDX: View Changes in Default Scratch Org”', async () => {
    // TODO: implement
    expect(1).toBe(1);
  });


  step('Tear down and clean up the testing environment', async () => {
    await scratchOrg.tearDown();
  });
});
