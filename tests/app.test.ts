
// import { Application } from '@luminix/support';

import App from '../src/facades/App';

App.create();

beforeEach(() => {
    App.down();
    jest.resetModules();
});

describe('testing application', () => {

    test('use app by facade', async () => {
        
        App.bind('test', () => ({ foo: () => 1 }));

        expect(App.make('test').foo()).toBe(1);
    });

    test('app rebooted by facade method, after flush', async () => {

        App.bind('foo', () => 'bar');
        expect(App.make('foo')).toBe('bar');

        App.down();
        App.getFacadeAccessor();

        App.bind('foo', () => 'bar');
        expect(App.make('foo')).toBe('bar');
    });

});
