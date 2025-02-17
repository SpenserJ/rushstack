// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

jest.disableAutomock();
import { resolve } from 'path';
import { promisify } from 'util';

import webpack, { type Compiler, type Stats } from 'webpack';
import { Volume } from 'memfs/lib/volume';

import { LocalizationPlugin } from '../LocalizationPlugin';
import type { ILocalizationPluginOptions } from '../interfaces';
import { MemFSPlugin } from './MemFSPlugin';

async function testLocalizedNoAsyncInner(minimize: boolean): Promise<void> {
  const memoryFileSystem: Volume = new Volume();
  memoryFileSystem.fromJSON(
    {
      '/a/package.json': '{ "name": "a", "sideEffects": ["entry.js"] }',
      '/a/entry.js': `import strings1 from './strings1.resjson'; import strings2 from './strings2.resjson'; console.log(strings1.test, strings2.another);`,
      '/a/strings1.resjson': JSON.stringify({
        test: 'blah\r\n\t\\\'"',
        '_test.comment': 'A string'
      }),
      '/a/strings2.resjson': `{"another":"something else","_another.comment":"Another string"}`
    },
    '/'
  );

  const resJsonLoader: string = resolve(__dirname, '../loaders/resjson-loader.js');
  const options: ILocalizationPluginOptions = {
    localizedData: {
      defaultLocale: {
        localeName: 'en-us',
        fillMissingTranslationStrings: true
      },
      translatedStrings: {
        foo: {
          '/a/strings1.resjson': {
            test: `return:\r,newline:\n,tab:\t,backslash:\\,apos:',quote:"`
          }
        }
      },
      passthroughLocale: {
        passthroughLocaleName: 'default',
        usePassthroughLocale: true
      },
      pseudolocales: {
        'qps-ploc': {
          prepend: '!--',
          append: '-|-'
        }
      }
    },
    localizationStats: {
      dropPath: 'localization-stats.json'
    }
  };

  const localizationPlugin: LocalizationPlugin = new LocalizationPlugin(options);

  const compiler: Compiler = webpack({
    entry: {
      main: '/a/entry.js'
    },
    output: {
      path: '/release',
      filename: '[name]-[locale].js'
    },
    module: {
      rules: [
        {
          test: /\.resjson$/,
          use: {
            loader: resJsonLoader
          },
          type: 'javascript/esm',
          sideEffects: false
        }
      ]
    },
    optimization: {
      minimize,
      moduleIds: 'named'
    },
    context: '/',
    mode: 'production',
    plugins: [localizationPlugin, new MemFSPlugin(memoryFileSystem)]
  });

  const stats: Stats | undefined = await promisify(compiler.run.bind(compiler))();
  await promisify(compiler.close.bind(compiler))();
  if (!stats) {
    throw new Error(`Expected stats`);
  }
  const { errors, warnings } = stats.toJson('errors-warnings');
  expect(errors).toMatchSnapshot('Errors');
  expect(warnings).toMatchSnapshot('Warnings');

  const results: {} = memoryFileSystem.toJSON('/release');
  expect(results).toMatchSnapshot('Content');
}

describe(LocalizationPlugin.name, () => {
  it('Handles localized compilation with no async chunks (unminified)', async () => {
    await testLocalizedNoAsyncInner(false);
  });

  it('Handles localized compilation with no async chunks (minified)', async () => {
    await testLocalizedNoAsyncInner(true);
  });
});
