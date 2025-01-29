
import { Application as App } from '@luminix/support';

import makeConfig from './config';

// import App from '../src/facades/App';

beforeEach(() => {
    jest.resetModules();
});

describe('testing configuration', () => {
    
    test('configuration get', () => {
        const app = new App();

        const jsConfig = makeConfig();

        app.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        app.create();

        app.on('ready', () => {
            const config = app.configuration;

            expect(config.get('app.name')).toBe('Test App');
            expect(config.has('app.name')).toBe(true);
        });
    });

    test('configuration is settable', () => {
        const app = new App();

        const jsConfig = makeConfig();

        app.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        app.create();

        app.on('ready', () => {
            const config = app.configuration;

            config.set('app.name', 'New Name');
            config.set('foo.bar.baz', 'New Value');

            expect(config.get('app.name')).toBe('New Name');
            expect(config.get('foo.bar.baz')).toBe('New Value');
        });
    });

    test('configuration merge', () => {
        const app = new App();

        const jsConfig = makeConfig();

        app.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        app.create();

        app.on('ready', () => {
            const config = app.configuration;
            
            config.merge('app', { name: 'New Name' });
           
            expect(config.get('app.name')).toBe('New Name');
        });
    });

    test('configuration lock', () => {
        const app = new App();

        const jsConfig = makeConfig();

        app.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        app.create();

        app.on('ready', () => {
            const config = app.configuration;
            
            config.lock('app');
            
            // expect(config.get('app.name')).toBe('Test App');
            expect(() => config.set('app.name', 'New Name')).toThrow('Cannot set a locked path "app.name"');

            config.set('foo', { bar: 'baz' });
            config.lock('foo');

            expect(() => config.merge('foo.ban', { baz: 'qux' })).toThrow('Cannot set a locked path "foo.ban"'); 
        });
    });

    test('configuration get with default', () => {
        const app = new App();

        const jsConfig = makeConfig();

        app.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        app.create();

        app.on('ready', () => {
            const config = app.configuration;
            
            expect(config.get('app.name', 'Default Name')).toBe('Test App');
            expect(config.get('app.unknown', 'Default Name')).toBe('Default Name');
        });
    });

    test('configuration delete', () => {
        const app = new App();

        const jsConfig = makeConfig();

        app.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        app.create();

        app.on('ready', () => {
            const config = app.configuration;
            
            config.delete('app.name');

            expect(config.get('app.name')).toBeUndefined();
        });
    });


    test('configuration errors', () => {
        const app = new App();

        const jsConfig = makeConfig();

        app.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        app.create();

        app.on('ready', () => {
            const config = app.configuration;
            
            config.set('qux', 'quux');

            expect(() => config.merge('qux', { quuz: 'corge' })).toThrow('Cannot merge a non-object path "qux"');

            config.set('foo', { bar: { deep: { deeper: { evenDeeper: 'baz' } } }});
            config.lock('foo.bar.deep.deeper');

            expect(() => config.merge('foo.bar', { deep: { deeper: { evenDeeper: 'qux' } } })).toThrow('Cannot set a path "foo.bar" that would override a locked path');
        });
    });
});

