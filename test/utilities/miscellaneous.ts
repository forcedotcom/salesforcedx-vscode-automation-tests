/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import os from 'os';
import { TextEditor, Workbench, sleep } from 'wdio-vscode-service';
import { EnvironmentSettings } from '../environmentSettings.ts';
import { attemptToFindOutputPanelText, clearOutputView } from './outputView.ts';
import { executeQuickPick } from './commandPrompt.ts';
import { notificationIsPresentWithTimeout } from './notifications.ts';
import * as DurationKit from '@salesforce/kit';
import path from 'path';
import { getWorkbench } from './workbench.ts';
import { PredicateWithTimeout } from './predicates.ts';

export async function pause(duration: Duration = Duration.seconds(1)): Promise<void> {
  await sleep(duration.milliseconds);
}

export function log(message: string): void {
  console.log(message);
}

export function debug(message: string): void {
  if (EnvironmentSettings.getInstance().debug) {
    const timestamp = new Date().toISOString();
    log(`${timestamp}:${message}`);
  }
}

export function currentOsUserName(): string {
  const userName =
    os.userInfo().username ||
    process.env.SUDO_USER ||
    process.env.C9_USER ||
    process.env.LOGNAME ||
    process.env.USER ||
    process.env.LNAME ||
    process.env.USERNAME;

  return userName!;
}

// There is an issue with InputBox.setText().  When a
// period is present, the string passed to the input box
// becomes truncated.  An fix for this is to replace
// the periods with an underscore.
export function transformedUserName(): string {
  return currentOsUserName().replace('.', '_');
}

/**
 * @param type type of html tag we want to find
 * @param attribute attribute that holds the given text
 * @param labelText text of the element we want to find
 * @returns element that contains the given text
 */
export async function findElementByText(
  type: string,
  attribute: string,
  labelText: string
): Promise<WebdriverIO.Element> {
  const element = await $(`${type}[${attribute}="${labelText}"]`);
  return element!;
}

/**
 * @param workbench page object representing the custom VSCode title bar
 * @param fileName name of the file we want to open and use
 * @returns editor for the given file name
 */
export async function getTextEditor(workbench: Workbench, fileName: string): Promise<TextEditor> {
  const inputBox = await executeQuickPick('Go to File...', Duration.seconds(1));
  await inputBox.setText(fileName);
  await inputBox.confirm();
  await pause(Duration.seconds(1));
  const editorView = workbench.getEditorView();
  const textEditor = (await editorView.openEditor(fileName)) as TextEditor;
  return textEditor;
}

export async function createCommand(
  type: string,
  name: string,
  folder: string,
  extension: string
): Promise<string | undefined> {
  const workbench = await getWorkbench();
  await clearOutputView();
  const inputBox = await executeQuickPick(`SFDX: Create ${type}`, Duration.seconds(1));

  // Set the name of the new component to name.
  await inputBox.setText(name);
  await inputBox.confirm();
  await pause(Duration.seconds(1));

  // Select the default directory (press Enter/Return).
  await inputBox.confirm();

  const successNotificationWasFound = await notificationIsPresentWithTimeout(
    workbench,
    `SFDX: Create ${type} successfully ran`,
    TEN_MINUTES
  );
  await expect(successNotificationWasFound).toBe(true);

  const outputPanelText = await attemptToFindOutputPanelText(
    `Salesforce CLI`,
    `Finished SFDX: Create ${type}`,
    10
  );
  await expect(outputPanelText).not.toBeUndefined();
  const typePath = path.join(`force-app`, `main`, `default`, folder, `${name}.${extension}`);
  await expect(outputPanelText).toContain(`create ${typePath}`);

  const metadataPath = path.join(
    `force-app`,
    `main`,
    `default`,
    folder,
    `${name}.${extension}-meta.xml`
  );
  await expect(outputPanelText).toContain(`create ${metadataPath}`);
  return outputPanelText;
}

// Type guard function to check if the argument is a Duration
export function isDuration(
  predicateOrWait: PredicateWithTimeout | Duration
): predicateOrWait is Duration {
  return (predicateOrWait as Duration).milliseconds !== undefined;
}

export enum Unit {
  MINUTES = DurationKit.Duration.Unit.MINUTES,
  MILLISECONDS = DurationKit.Duration.Unit.MILLISECONDS,
  SECONDS = DurationKit.Duration.Unit.SECONDS,
  HOURS = DurationKit.Duration.Unit.HOURS,
  DAYS = DurationKit.Duration.Unit.DAYS,
  WEEKS = DurationKit.Duration.Unit.WEEKS
}

export class Duration extends DurationKit.Duration {
  private scaleFactor: number;

  constructor(quantity: number, unit: Unit, scaleFactor?: number) {
    super(quantity, unit);
    if (scaleFactor !== undefined) {
      this.scaleFactor = scaleFactor;
    } else {
      this.scaleFactor = EnvironmentSettings.getInstance().throttleFactor;
    }
  }

  public get minutes(): number {
    return super.minutes * this.scaleFactor;
  }

  public get hours(): number {
    return super.hours * this.scaleFactor;
  }

  public get milliseconds(): number {
    return super.milliseconds * this.scaleFactor;
  }

  public get seconds(): number {
    return super.seconds * this.scaleFactor;
  }

  public get days(): number {
    return super.days * this.scaleFactor;
  }

  public get weeks(): number {
    return super.weeks * this.scaleFactor;
  }

  // Static methods for creating new instances without specifying scaleFactor
  public static milliseconds(quantity: number): Duration {
    return new Duration(quantity, Unit.MILLISECONDS);
  }

  public static seconds(quantity: number): Duration {
    return new Duration(quantity, Unit.SECONDS);
  }

  public static minutes(quantity: number): Duration {
    return new Duration(quantity, Unit.MINUTES);
  }

  public static hours(quantity: number): Duration {
    return new Duration(quantity, Unit.HOURS);
  }

  public static days(quantity: number): Duration {
    return new Duration(quantity, Unit.DAYS);
  }

  public static weeks(quantity: number): Duration {
    return new Duration(quantity, Unit.WEEKS);
  }
}

export const FIVE_MINUTES = Duration.minutes(5);
export const TEN_MINUTES = Duration.minutes(10);
