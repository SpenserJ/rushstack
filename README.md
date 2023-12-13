# Reproduction for `@rushstack/eslint-patch` bulk suppression failing in polyrepo

This is a simple reproduction of `@rushstack/eslint-patch/eslint-bulk-suppressions` failing to detect the `.eslintrc.js` in a simple polyrepo. This issue is caused by https://github.com/microsoft/rushstack/blob/d9e0c73c31a125df8b39871f73c4f6c5a706f638/eslint/eslint-patch/src/eslint-bulk-suppressions/bulk-suppressions-patch.ts#L76-L81 looping until it reaches the git root directory, instead of looping until it has gone beyond the root directory.

To reproduce the issue, run `npm ci` and then run `npm run lint`. Commenting out the patch's `require` or manually editing line 90 of `node_modules/@rushstack/eslint-patch/lib/eslint-bulk-suppressions/bulk-suppressions-patch.js` to `currentDir.startsWith(exports.GitRootPath)` (instead of `currentDir !== exports.GitRootPath`) will allow the command to succeed.
