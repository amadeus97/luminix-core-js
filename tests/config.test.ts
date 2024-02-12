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
});

