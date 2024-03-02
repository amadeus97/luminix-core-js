import App from '../src/facades/App';
import makeConfig from './config';

describe('testing macros', () => {

    test('macro operations', async () => {
        const app = new App();


        app.on('booted', () => {
            const repository = app.make('repository');

            repository.macro('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro2)`;
            }, 20);

            repository.macro('modelUserGetNameAttribute', (name: string) => {
                return `${name} (macro)`;
            });

        });

        app.boot({
            config: makeConfig(),
        }).then(({ repository }) => {

            expect(repository.getMacro('modelUserGetNameAttribute')).toHaveLength(2);

            const User = repository.make('user');
            const user = new User({ id: 1, name: 'John Doe' });

            expect(user.name).toBe('John Doe (macro) (macro2)');

            const [filter1, filter2] = repository.getMacro('modelUserGetNameAttribute');

            repository.removeMacro('modelUserGetNameAttribute', filter1.callback);

            expect(repository.getMacro('modelUserGetNameAttribute')).toHaveLength(1);
            expect(repository.hasMacro('modelUserGetNameAttribute')).toBe(true);
            expect(repository.getMacro('modelUserGetNameAttribute')).toEqual([filter2]);

            repository.clearMacro('modelUserGetNameAttribute');

            expect(user.name).toBe('John Doe');
        });
    });
});
