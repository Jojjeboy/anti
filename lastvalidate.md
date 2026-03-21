# Validation Output (2026-03-21T21:37:55.648Z)

```bash

> looplist@11.0.0 build:only
> tsc -b && vite build

vite v7.3.1 building client environment for production...
transforming...
✓ 2458 modules transformed.
rendering chunks...
computing gzip size...
dist/manifest.webmanifest                            0.36 kB
dist/index.html                                      0.54 kB │ gzip:   0.32 kB
dist/assets/gemini-BfquLd1p.svg                      8.71 kB │ gzip:   2.02 kB
dist/assets/index-Czk8RplI.css                      50.67 kB │ gzip:   8.23 kB
dist/assets/workbox-window.prod.es5-BIl4cyR9.js      5.76 kB │ gzip:   2.37 kB
dist/assets/index-AZ1_a4x8.js                    1,378.32 kB │ gzip: 416.98 kB

(!) Some chunks are larger than 1300 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 3.94s
Unknown input options: manualChunks. Allowed options: cache, context, experimentalCacheExpiry, experimentalLogSideEffects, external, fs, input, jsx, logLevel, makeAbsoluteExternalsRelative, maxParallelFileOps, moduleContext, onLog, onwarn, perf, plugins, preserveEntrySignatures, preserveSymlinks, shimMissingExports, strictDeprecations, treeshake, watch

PWA v1.2.0
mode      generateSW
precache  8 entries (1401.65 KiB)
files generated
  dist/sw.js

> looplist@11.0.0 lint
> eslint .


> looplist@11.0.0 check-any
> eslint . --config eslint.strict.config.js


> looplist@11.0.0 test
> vitest run --coverage


[1m[46m RUN [49m[22m [36mv4.0.16 [39m[90m/Users/jk/kod/looplist[39m
      [2mCoverage enabled with [22m[33mv8[39m

[90mstderr[2m | src/hooks/useFirestoreSync.test.ts[2m > [22m[2museFirestoreSync[2m > [22m[2mshould handle snapshot errors
[22m[39mFirestore sync error for users/test-user-id/test-collection: Error: Firestore error
    at [90m/Users/jk/kod/looplist/[39msrc/hooks/useFirestoreSync.test.ts:89:27
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:145:11
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:915:26
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1243:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1209:10[90m)[39m
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:37
    at Traces.$ [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/traces.U4xDYhzZ.js:115:27[90m)[39m
    at trace [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/test.B8ej_ZHS.js:239:21[90m)[39m
    at runTest [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:12[90m)[39m

[90mstderr[2m | src/context/ToastContext.test.tsx[2m > [22m[2mToastContext[2m > [22m[2mshowToast adds a toast
[22m[39mAn update to ToastProvider inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

[90mstderr[2m | src/hooks/useFirestoreSync.test.ts[2m > [22m[2museFirestoreSync[2m > [22m[2mshould add item successfully
[22m[39mFirestore sync error for users/test-user-id/test-collection: Error: Firestore error
    at [90m/Users/jk/kod/looplist/[39msrc/hooks/useFirestoreSync.test.ts:89:27
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:145:11
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:915:26
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1243:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1209:10[90m)[39m
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:37
    at Traces.$ [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/traces.U4xDYhzZ.js:115:27[90m)[39m
    at trace [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/test.B8ej_ZHS.js:239:21[90m)[39m
    at runTest [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:12[90m)[39m

[90mstderr[2m | src/hooks/useFirestoreSync.test.ts[2m > [22m[2museFirestoreSync[2m > [22m[2mshould update item successfully
[22m[39mFirestore sync error for users/test-user-id/test-collection: Error: Firestore error
    at [90m/Users/jk/kod/looplist/[39msrc/hooks/useFirestoreSync.test.ts:89:27
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:145:11
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:915:26
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1243:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1209:10[90m)[39m
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:37
    at Traces.$ [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/traces.U4xDYhzZ.js:115:27[90m)[39m
    at trace [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/test.B8ej_ZHS.js:239:21[90m)[39m
    at runTest [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:12[90m)[39m

[90mstderr[2m | src/context/ToastContext.test.tsx[2m > [22m[2mToastContext[2m > [22m[2mremoveToast removes a toast by id
[22m[39mAn update to ToastProvider inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

[90mstderr[2m | src/hooks/useFirestoreSync.test.ts[2m > [22m[2museFirestoreSync[2m > [22m[2mshould delete item successfully
[22m[39mFirestore sync error for users/test-user-id/test-collection: Error: Firestore error
    at [90m/Users/jk/kod/looplist/[39msrc/hooks/useFirestoreSync.test.ts:89:27
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:145:11
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:915:26
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1243:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1209:10[90m)[39m
    at [90mfile:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:37
    at Traces.$ [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/traces.U4xDYhzZ.js:115:27[90m)[39m
    at trace [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4mvitest[24m/dist/chunks/test.B8ej_ZHS.js:239:21[90m)[39m
    at runTest [90m(file:///Users/jk/kod/looplist/[39mnode_modules/[4m@vitest/runner[24m/dist/index.js:1653:12[90m)[39m

 [32m✓[39m src/context/AuthContext.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/context/ToastContext.test.tsx [2m([22m[2m3 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/hooks/useFirestoreSync.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m src/components/Modal.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[32m 57[2mms[22m[39m
 [32m✓[39m src/components/SearchResults.test.tsx [2m([22m[2m5 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m src/components/SessionPicker.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 69[2mms[22m[39m
[90mstderr[2m | src/components/ListDetail.test.tsx[2m > [22m[2mListDetail[2m > [22m[2madds a new item
[22m[39mAn update to ListDetail inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

[90mstderr[2m | src/components/ListDetail.test.tsx[2m > [22m[2mListDetail[2m > [22m[2mtoggles item completion
[22m[39mAn update to ListDetail inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

[90mstderr[2m | src/components/SessionDetail.test.tsx[2m > [22m[2mSessionDetail[2m > [22m[2mcompletes session
[22m[39mNo routes matched location "/category/cat1" 

 [32m✓[39m src/components/CombinationEditor.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[32m 76[2mms[22m[39m
 [32m✓[39m src/context/AppContext.test.tsx [2m([22m[2m9 tests[22m[2m)[22m[32m 38[2mms[22m[39m
 [32m✓[39m src/components/SessionDetail.test.tsx [2m([22m[2m5 tests[22m[2m)[22m[32m 87[2mms[22m[39m
 [32m✓[39m src/components/ListDetail.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 55[2mms[22m[39m
 [32m✓[39m src/components/CategoryView.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[32m 31[2mms[22m[39m

[2m Test Files [22m [1m[32m11 passed[39m[22m[90m (11)[39m
[2m      Tests [22m [1m[32m61 passed[39m[22m[90m (61)[39m
[2m   Start at [22m 22:38:07
[2m   Duration [22m 1.59s[2m (transform 1.35s, setup 1.71s, import 3.14s, tests 516ms, environment 7.26s)[22m

JUNIT report written to /Users/jk/kod/looplist/dist/test-results.xml
[34m % [39m[2mCoverage report from [22m[33mv8[39m
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   53.87 |    44.42 |   46.98 |    54.9 |                   
 src               |     100 |      100 |     100 |     100 |                   
  firebase.ts      |     100 |      100 |     100 |     100 |                   
 src/assets        |       0 |        0 |       0 |       0 |                   
  gemini.svg       |       0 |        0 |       0 |       0 |                   
 src/components    |   53.45 |    47.95 |   47.48 |   54.65 |                   
  CategoryView.tsx |   34.31 |       25 |      25 |   36.55 | ...08-282,305-404 
  ...ionEditor.tsx |   93.47 |    84.61 |   94.44 |    92.5 | 33-34,54          
  ...rBoundary.tsx |   31.25 |    16.66 |   42.85 |   31.25 | 22-30,35-40,48-80 
  ListDetail.tsx   |   40.92 |    35.26 |   27.95 |   43.28 | ...5-760,777-1029 
  Modal.tsx        |    91.3 |    88.23 |   85.71 |   90.47 | 35-36             
  ...chResults.tsx |   88.23 |    93.33 |   81.81 |    87.5 | 32,51             
  ...ionDetail.tsx |   82.14 |    67.44 |   94.11 |      80 | 52-63,86,214      
  ...ionPicker.tsx |   82.35 |       75 |   83.33 |   84.78 | 41,81-85,144      
 src/context       |   56.01 |     27.9 |    43.2 |   57.67 |                   
  AppContext.tsx   |      50 |       25 |    30.3 |   52.23 | ...42,447-457,517 
  AuthContext.tsx  |      80 |       75 |     100 |   79.16 | 38-39,47-48,62    
  ToastContext.tsx |   94.73 |       50 |     100 |   93.75 | 49                
 src/hooks         |   48.27 |    34.78 |      60 |   46.34 |                   
  ...estoreSync.ts |     100 |      100 |     100 |     100 |                   
  ...calStorage.ts |       0 |        0 |       0 |       0 | 9-96              
-------------------|---------|----------|---------|---------|-------------------

```
