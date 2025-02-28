
import App from '../src/facades/App';

import makeConfig from './config';

App.withConfiguration(makeConfig());
App.create();

beforeEach(() => {
    jest.resetModules();
});

describe.skip('testing macros', () => {

    test('macro operations', async () => {

        App.on('booted', () => {
            const model = App.make('model');

            model.reducer('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro2)`;
            }, 20);

            model.reducer('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro)`;
            });
        });

        App.on('ready', () => {
            // const model = App.configuration.model;
            const model = App.make('model');

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
