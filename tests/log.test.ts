
import makeConfig from './config';

import App from '../src/facades/App';

beforeEach(() => {
    jest.resetModules();
});

describe('testing log', () => {
    
    test('log works', async () => {

        const jsConfig = makeConfig();

        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();

        App.withConfiguration({
            ...jsConfig,
            app: {
                ...jsConfig.app,
                debug: true
            }
        });

        App.create();

        expect(console.log).toHaveBeenCalledTimes(0);
        expect(console.warn).toHaveBeenCalledTimes(0);
        expect(console.error).toHaveBeenCalledTimes(0);
        expect(console.info).toHaveBeenCalledTimes(1);

        const log = App.make('log');

        log.emergency('emergency');
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith('emergency');

        log.alert('alert');
        expect(console.error).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenCalledWith('alert');

        log.critical('critical');
        expect(console.error).toHaveBeenCalledTimes(3);
        expect(console.error).toHaveBeenCalledWith('critical');

        log.error('error');
        expect(console.error).toHaveBeenCalledTimes(4);
        expect(console.error).toHaveBeenCalledWith('error');

        log.warning('warning');
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('warning');

        log.notice('notice');
        expect(console.info).toHaveBeenCalledTimes(2);
        expect(console.info).toHaveBeenCalledWith('notice');

        log.debug('debug');
        expect(console.debug).toHaveBeenCalledTimes(1);
        expect(console.debug).toHaveBeenCalledWith('debug');
    });

});
