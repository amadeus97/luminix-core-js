import App from '../src/facades/App';
import makeConfig from './config';

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

        app.boot(makeConfig()).then(({ model }) => {

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
