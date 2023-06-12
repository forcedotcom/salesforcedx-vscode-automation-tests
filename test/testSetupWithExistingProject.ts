import { TestSetup } from "./testSetup";

export class TestSetupWithWExistingProject extends TestSetup {
  public constructor(projectFolderPath: string,
    testSuiteSuffixName: string,
    reuseScratchOrg: boolean) {
    super(testSuiteSuffixName, reuseScratchOrg);
    this.projectFolderPath = projectFolderPath;
  }

  public set projectFolderPath(value: string | undefined) {
    this._projectFolderPath = value;
  }

  // overriding base class method to not remove the project during setup or teardown
  protected removeProject(): Promise<void> {
    return Promise.resolve();
  }
}