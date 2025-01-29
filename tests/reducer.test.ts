
import { Application as App } from '@luminix/support';

import makeConfig from './config';

// import App from '../src/facades/App';

beforeEach(() => {
    jest.resetModules();
});

describe('testing macros', () => {

    test('macro operations', async () => {
        const app = new App();

        app.on('booted', () => {
            const model = app.make('model');

            model.reducer('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro2)`;
            }, 20);

            model.reducer('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro)`;
            });

        });

        app.withConfiguration(makeConfig());

        app.create();

        app.on('ready', () => {
            // const model = app.configuration.model;
            const model = app.make('model');

            expect(model.getReducer('modelUserGetNameAttribute').count()).toBe(2);

            const User = model.make('user');
            const user = new User({ id: 1, name: 'John Doe' });

            expect(user.name).toBe('John Doe (macro) (macro2)');

            const [filter1, filter2] = model.getReducer('modelUserGetNameAttribute');

            model.removeReducer('modelUserGetNameAttribute', filter1.callback);

            expect(model.getReducer('modelUserGetNameAttribute').count()).toBe(1);
            expect(model.hasReducer('modelUserGetNameAttribute')).toBe(true);
            expect(model.getReducer('modelUserGetNameAttribute').all()).toEqual([filter2]);

            model.clearReducer('modelUserGetNameAttribute');

            expect(user.name).toBe('John Doe');
        });
    });

});
