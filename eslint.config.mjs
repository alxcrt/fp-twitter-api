import {defineConfig,globalIgnores} from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import next from '@next/eslint-plugin-next';
import globals from 'globals';
export default defineConfig([
 globalIgnores(['.next/**','generated/**','next-env.d.ts']),
 {files:['**/*.{js,mjs,ts,tsx}'],languageOptions:{globals:{...globals.node,...globals.browser}}},
 js.configs.recommended,
 ...tseslint.configs.recommended,
 {plugins:{'@next/next':next},rules:{...next.configs.recommended.rules,...next.configs['core-web-vitals'].rules}},
]);
