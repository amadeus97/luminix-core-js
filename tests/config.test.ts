
import makeConfig from './config';

import App from '../src/facades/App';

beforeEach(() => {
    jest.resetModules();
});

afterEach(() => {
    App.down();
});

describe('testing configuration', () => {
    
    test('configuration get', () => {

        const jsConfig = makeConfig();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        App.create();

        App.on('ready', () => {
            const config = App.configuration;

            expect(config.get('App.name')).toBe('Test App');
            expect(config.has('App.name')).toBe(true);
        });
    });

    test('configuration is settable', () => {

        const jsConfig = makeConfig();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        App.create();

        App.on('ready', () => {
            const config = App.configuration;

            config.set('App.name', 'New Name');
            config.set('foo.bar.baz', 'New Value');

            expect(config.get('App.name')).toBe('New Name');
            expect(config.get('foo.bar.baz')).toBe('New Value');
        });
    });

    test('configuration merge', () => {

        const jsConfig = makeConfig();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        App.create();

        App.on('ready', () => {
            const config = App.configuration;
            
            config.merge('app', { name: 'New Name' });
           
            expect(config.get('App.name')).toBe('New Name');
        });
    });

    test('configuration lock', () => {

        const jsConfig = makeConfig();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        App.create();

        App.on('ready', () => {
            const config = App.configuration;
            
            config.lock('app');
            
            // expect(config.get('App.name')).toBe('Test App');
            expect(() => config.set('App.name', 'New Name')).toThrow('Cannot set a locked path "App.name"');

            config.set('foo', { bar: 'baz' });
            config.lock('foo');

            expect(() => config.merge('foo.ban', { baz: 'qux' })).toThrow('Cannot set a locked path "foo.ban"'); 
        });
    });

    test('configuration get with default', () => {

        const jsConfig = makeConfig();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        App.create();

        App.on('ready', () => {
            const config = App.configuration;
            
            expect(config.get('App.name', 'Default Name')).toBe('Test App');
            expect(config.get('App.unknown', 'Default Name')).toBe('Default Name');
        });
    });

    test('configuration delete', () => {

        const jsConfig = makeConfig();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        App.create();

        App.on('ready', () => {
            const config = App.configuration;
            
            config.delete('App.name');

            expect(config.get('App.name')).toBeUndefined();
        });
    });

    test('configuration errors', () => {

        const jsConfig = makeConfig();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                bootUrl: null,
            }
        });

        App.create();

        App.on('ready', () => {
            const config = App.configuration;
            
            config.set('qux', 'quux');

            expect(() => config.merge('qux', { quuz: 'corge' })).toThrow('Cannot merge a non-object path "qux"');

            config.set('foo', { bar: { deep: { deeper: { evenDeeper: 'baz' } } }});
            config.lock('foo.bar.deep.deeper');

            expect(() => config.merge('foo.bar', { deep: { deeper: { evenDeeper: 'qux' } } })).toThrow('Cannot set a path "foo.bar" that would override a locked path');
        });
    });

});
