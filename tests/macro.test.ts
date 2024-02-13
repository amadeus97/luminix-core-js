import App from '../src/facades/App';
import makeConfig from './config';

describe('testing macros', () => {

    test('macro operations', async () => {
        const app = new App();

        const mockedFn = jest.fn();
        const secondMockedFn = jest.fn();

        app.boot({
            config: makeConfig(),
            macros: ({ macro }) => {
                macro.addFilter('model_user_get_name_attribute', (name: string) => {
                    return `${name} (macro2)`;
                }, 20);

                macro.addFilter('model_user_get_name_attribute', (name: string) => {
                    return `${name} (macro)`;
                });

                macro.addAction('booted', mockedFn);
                macro.addAction('booted', secondMockedFn, 20);
            }
        }).then(({ repository, macro }) => {
            expect(mockedFn).toHaveBeenCalledTimes(1);
            expect(secondMockedFn).toHaveBeenCalledTimes(1);

            expect(macro.getActions('booted')).toHaveLength(2);
            expect(macro.getFilters('model_user_get_name_attribute')).toHaveLength(2);

            const User = repository.make('user');
            const user = new User({ id: 1, name: 'John Doe' });

            expect(user.name).toBe('John Doe (macro) (macro2)');

            macro.removeAction('booted', secondMockedFn);
            expect(macro.getActions('booted')).toHaveLength(1);

            const [filter1, filter2] = macro.getFilters('model_user_get_name_attribute');
            macro.removeFilter('model_user_get_name_attribute', filter1.callback);

            expect(macro.getFilters('model_user_get_name_attribute')).toHaveLength(1);
            expect(macro.hasFilter('model_user_get_name_attribute')).toBe(true);
            expect(macro.hasAction('booted')).toBe(true);
            expect(macro.getFilters('model_user_get_name_attribute')).toEqual([filter2]);

            macro.clearActions('booted');

            expect(macro.getActions('booted')).toHaveLength(0);

            macro.clearFilters('model_user_get_name_attribute');
            expect(user.name).toBe('John Doe');
        });
    });
});
