import App from '../src/facades/App';
import makeConfig from './config';

describe('testing macros', () => {

    test('macro operations', async () => {
        const app = new App();

        const mockedFn = jest.fn();
        const secondMockedFn = jest.fn();

        app.on('init', (e) => {
            const macro = app.make('macro');
            macro.add('model_user_get_name_attribute', (name: string) => {
                return `${name} (macro2)`;
            }, 20);

            macro.add('model_user_get_name_attribute', (name: string) => {
                return `${name} (macro)`;
            });

            app.on('booted', mockedFn);
            app.on('booted', secondMockedFn);
        });

        app.boot({
            config: makeConfig(),
        }).then(({ repository, macro }) => {
            expect(mockedFn).toHaveBeenCalledTimes(1);
            expect(secondMockedFn).toHaveBeenCalledTimes(1);

            expect(macro.get('model_user_get_name_attribute')).toHaveLength(2);

            const User = repository.make('user');
            const user = new User({ id: 1, name: 'John Doe' });

            expect(user.name).toBe('John Doe (macro) (macro2)');


            const [filter1, filter2] = macro.get('model_user_get_name_attribute');
            macro.remove('model_user_get_name_attribute', filter1.callback);

            expect(macro.get('model_user_get_name_attribute')).toHaveLength(1);
            expect(macro.has('model_user_get_name_attribute')).toBe(true);
            expect(macro.get('model_user_get_name_attribute')).toEqual([filter2]);

            macro.clear('model_user_get_name_attribute');
            expect(user.name).toBe('John Doe');
        });
    });
});
