import makeConfig from './config';
import App from '../src/facades/App';

describe('testing configuration', () => {
    
    test('configuration get', () => {
        const app = new App();

        app.boot({
            config: makeConfig(),
            skipBootRequest: true,
        }).then(({ config }) => {
            expect(config.get('app.name')).toBe('Test App');
            expect(config.has('app.name')).toBe(true);
        });
    });

    test('configuration is settable', () => {
        const app = new App();

        app.boot({
            config: makeConfig(),
            skipBootRequest: true,
        }).then(({ config }) => {
            config.set('app.name', 'New Name');
            config.set('foo.bar.baz', 'New Value');
            expect(config.get('app.name')).toBe('New Name');
            expect(config.get('foo.bar.baz')).toBe('New Value');
        });
    });

    test('configuration merge', () => {
        const app = new App();

        app.boot({
            config: makeConfig(),
            skipBootRequest: true,
        }).then(({ config }) => {
            config.merge('app', { name: 'New Name' });
            expect(config.get('app.name')).toBe('New Name');
        });
    });

    test('configuration lock', () => {
        const app = new App();

        app.boot({
            config: makeConfig(),
            skipBootRequest: true,
        }).then(({ config }) => {
            config.lock('app');
            config.set('app.name', 'New Name');
            expect(config.get('app.name')).toBe('Test App');

            config.set('foo', { bar: 'baz' });
            config.lock('foo');
            config.merge('foo.ban', { baz: 'qux' });
            expect(config.get('foo.ban')).toBeUndefined();
        });
    });

    test('configuration get with default', () => {
        const app = new App();

        app.boot({
            config: makeConfig(),
            skipBootRequest: true,
        }).then(({ config }) => {
            expect(config.get('app.name', 'Default Name')).toBe('Test App');
            expect(config.get('app.unknown', 'Default Name')).toBe('Default Name');
        });
    });

    test('configuration delete', () => {
        const app = new App();

        app.boot({
            config: makeConfig(),
            skipBootRequest: true,
        }).then(({ config }) => {
            config.delete('app.name');
            expect(config.get('app.name')).toBeUndefined();
        });
    });


    test('configuration warnings', () => {
        const app = new App();

        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
        console.info = jest.fn();

        const jsConfig = makeConfig();
        app.boot({
            config: {
                ...jsConfig,
                app: {
                    ...jsConfig.app,
                    debug: true,
                }
            },
            skipBootRequest: true,
        }).then(({ config }) => {
            config.set('qux', 'quux');
            config.merge('qux', { quuz: 'corge' });
            
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalledWith('Config is trying to merge a path with non-object', {
                path: 'qux',
                currentValue: 'quux',
                value: { quuz: 'corge' }
            });

            config.lock('qux');
            config.lock('qux');
            config.delete('qux');

            expect(console.warn).toHaveBeenCalledTimes(2);
            expect(console.warn).toHaveBeenCalledWith('Config path "qux" is locked. Cannot delete value.');
        });
    });
});

