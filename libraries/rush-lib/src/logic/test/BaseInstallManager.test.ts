// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import { ConsoleTerminalProvider } from '@rushstack/node-core-library';

import { PurgeManager } from '../PurgeManager';
import { BaseInstallManager, pnpmIgnoreCompatibilityDbParameter } from '../base/BaseInstallManager';
import type { IInstallManagerOptions } from '../base/BaseInstallManagerTypes';

import { RushConfiguration } from '../../api/RushConfiguration';
import { RushGlobalFolder } from '../../api/RushGlobalFolder';

class FakeBaseInstallManager extends BaseInstallManager {
  public constructor(
    rushConfiguration: RushConfiguration,
    rushGlobalFolder: RushGlobalFolder,
    purgeManager: PurgeManager,
    options: IInstallManagerOptions
  ) {
    super(rushConfiguration, rushGlobalFolder, purgeManager, options);
  }

  protected prepareCommonTempAsync(): Promise<{
    shrinkwrapIsUpToDate: boolean;
    shrinkwrapWarnings: string[];
  }> {
    return Promise.resolve({ shrinkwrapIsUpToDate: true, shrinkwrapWarnings: [] });
  }

  protected installAsync(): Promise<void> {
    return Promise.resolve();
  }

  protected postInstallAsync(): Promise<void> {
    return Promise.resolve();
  }
  public pushConfigurationArgs(args: string[], options: IInstallManagerOptions): void {
    return super.pushConfigurationArgs(args, options);
  }
}

describe('BaseInstallManager Test', () => {
  const rushGlobalFolder: RushGlobalFolder = new RushGlobalFolder();

  it('pnpm version in 6.32.12 - 6.33.x || 7.0.1 - 7.8.x should output warning', () => {
    const rushJsonFilePnpmV6: string = path.resolve(__dirname, 'ignoreCompatibilityDb/rush1.json');
    const rushJsonFilePnpmV7: string = path.resolve(__dirname, 'ignoreCompatibilityDb/rush2.json');
    const rushConfigurationV6: RushConfiguration =
      RushConfiguration.loadFromConfigurationFile(rushJsonFilePnpmV6);
    const rushConfigurationV7: RushConfiguration =
      RushConfiguration.loadFromConfigurationFile(rushJsonFilePnpmV7);
    const purgeManager6: typeof PurgeManager.prototype = new PurgeManager(
      rushConfigurationV6,
      rushGlobalFolder
    );
    const purgeManager7: typeof PurgeManager.prototype = new PurgeManager(
      rushConfigurationV7,
      rushGlobalFolder
    );
    const options: IInstallManagerOptions = {} as IInstallManagerOptions;

    const fakeBaseInstallManager6: FakeBaseInstallManager = new FakeBaseInstallManager(
      rushConfigurationV6,
      rushGlobalFolder,
      purgeManager6,
      options
    );

    const fakeBaseInstallManager7: FakeBaseInstallManager = new FakeBaseInstallManager(
      rushConfigurationV7,
      rushGlobalFolder,
      purgeManager7,
      options
    );

    const mockWrite = jest.fn();
    jest.spyOn(ConsoleTerminalProvider.prototype, 'write').mockImplementation(mockWrite);

    const argsPnpmV6: string[] = [];
    fakeBaseInstallManager6.pushConfigurationArgs(argsPnpmV6, options);
    expect(argsPnpmV6).not.toContain(pnpmIgnoreCompatibilityDbParameter);
    expect(mockWrite.mock.calls[0][0]).toContain(
      "Warning: Your rush.json specifies a pnpmVersion with a known issue that may cause unintended version selections. It's recommended to upgrade to PNPM >=6.34.0 or >=7.9.0. For details see: https://rushjs.io/link/pnpm-issue-5132"
    );

    const argsPnpmV7: string[] = [];
    fakeBaseInstallManager7.pushConfigurationArgs(argsPnpmV7, options);
    expect(argsPnpmV7).not.toContain(pnpmIgnoreCompatibilityDbParameter);
    expect(mockWrite.mock.calls[0][0]).toContain(
      "Warning: Your rush.json specifies a pnpmVersion with a known issue that may cause unintended version selections. It's recommended to upgrade to PNPM >=6.34.0 or >=7.9.0. For details see: https://rushjs.io/link/pnpm-issue-5132"
    );
  });

  it(`pnpm version ^6.34.0 || gte 7.9.0 should add ${pnpmIgnoreCompatibilityDbParameter}`, () => {
    const rushJsonFile: string = path.resolve(__dirname, 'ignoreCompatibilityDb/rush3.json');
    const rushConfiguration: RushConfiguration = RushConfiguration.loadFromConfigurationFile(rushJsonFile);
    const purgeManager: typeof PurgeManager.prototype = new PurgeManager(rushConfiguration, rushGlobalFolder);
    const options: IInstallManagerOptions = {} as IInstallManagerOptions;

    const fakeBaseInstallManager: FakeBaseInstallManager = new FakeBaseInstallManager(
      rushConfiguration,
      rushGlobalFolder,
      purgeManager,
      options
    );

    const mockWrite = jest.fn();
    jest.spyOn(ConsoleTerminalProvider.prototype, 'write').mockImplementation(mockWrite);

    const args: string[] = [];
    fakeBaseInstallManager.pushConfigurationArgs(args, options);
    expect(args).toContain(pnpmIgnoreCompatibilityDbParameter);

    if (mockWrite.mock.calls.length) {
      expect(mockWrite.mock.calls[0][0]).not.toContain(
        "Warning: Your rush.json specifies a pnpmVersion with a known issue that may cause unintended version selections. It's recommended to upgrade to PNPM >=6.34.0 or >=7.9.0. For details see: https://rushjs.io/link/pnpm-issue-5132"
      );
    }
  });
});
