import { defineConfig } from 'vite';
import { resolve } from 'path';

import dts from 'vite-plugin-dts';

import packageJson from './package.json';

export default defineConfig({
    plugins: [dts({ insertTypesEntry: true })],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'LuminixCore',
            // formats: ['es']
        },
        rollupOptions: {
            external: Object.keys(packageJson.peerDependencies),
        }
    },
    
});
