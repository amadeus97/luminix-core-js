import App from '../src/facades/App';
import { AppFacade } from '../src/types/App';
import makeConfig from './config';

describe('testing log', () => {
    
    test('log works', async () => {
        const app: AppFacade = new App();
        const config = makeConfig();

        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();

        await app.boot({
            config: {
                ...config,
                app: {
                    ...config.app,
                    debug: true
                }
            }
        });

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledTimes(0);
        expect(console.error).toHaveBeenCalledTimes(0);
        expect(console.info).toHaveBeenCalledTimes(10);

        const log = app.make('log');

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
        expect(console.info).toHaveBeenCalledTimes(11);
        expect(console.info).toHaveBeenCalledWith('notice');

        log.debug('debug');
        expect(console.debug).toHaveBeenCalledTimes(1);
        expect(console.debug).toHaveBeenCalledWith('debug');

    });

});

