import App from '../src/facades/App';
import makeConfig from './config';

describe('testing macros', () => {

    test('macro operations', async () => {
        const app = new App();


        app.on('booted', () => {
            const repository = app.make('repository');

            repository.reducer('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro2)`;
            }, 20);

            repository.reducer('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro)`;
            });

        });

        app.boot(makeConfig()).then(({ repository }) => {

            expect(repository.getReducer('modelUserGetNameAttribute')).toHaveLength(2);

            const User = repository.make('user');
            const user = new User({ id: 1, name: 'John Doe' });

            expect(user.name).toBe('John Doe (macro) (macro2)');

            const [filter1, filter2] = repository.getReducer('modelUserGetNameAttribute');

            repository.removeReducer('modelUserGetNameAttribute', filter1.callback);

            expect(repository.getReducer('modelUserGetNameAttribute')).toHaveLength(1);
            expect(repository.hasReducer('modelUserGetNameAttribute')).toBe(true);
            expect(repository.getReducer('modelUserGetNameAttribute')).toEqual([filter2]);

            repository.clearReducer('modelUserGetNameAttribute');

            expect(user.name).toBe('John Doe');
        });
    });
});
