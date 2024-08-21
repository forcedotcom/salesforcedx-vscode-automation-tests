/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 * We store the salesforcedx-vscode specific constants here. 
 */

// the name of repos
export enum repoKeywords {
  DeployInv = 'DeployInv'
}

// a map from a repo name to git url
export const projectMaps = new Map<repoKeywords, string>([
  [repoKeywords.DeployInv, 'https://github.com/mingxuanzhangsfdx/DeployInv']
])