
import { 
    Application as App, 
    PropertyBag, 
    MakeFacade, 
    HasFacadeAccessor, 
    ServiceProvider, 
    // FacadeOf,
} from '@luminix/support';

// import makeConfig from './config';
import mockAxios from 'axios';

// import Plugin from '../src/contracts/Plugin';

// import App from '../src/facades/App';
import Auth from '../src/facades/Auth';
import Log from '../src/facades/Log';
import ModelFacade from '../src/facades/Model';

// import { AppFacade } from '../src/types/App';
import { AuthFacade } from '../src/types/Auth';

beforeEach(() => {
    jest.resetModules();
});

class TestFacadeClass implements HasFacadeAccessor {

    getFacadeAccessor(): string {
        return 'test';
    }

}

class TestServiceProvider extends ServiceProvider {
    
    register() {
        this.app.bind('test', () => new TestService());
    }
}

class TestService {

    foo() {
        return 1;
    }

    bar() {
        return 2;
    }

}

describe('testing application', () => {

    test('app boot', async () => {
        const app = new App();

        app.create();

        // expect(app.plugins().length).toBe(0);
        expect(app.make('auth')).toBeInstanceOf(Auth);
        expect(app.make('config')).toBeInstanceOf(PropertyBag);
        expect(app.make('log')).toBeInstanceOf(Log);
        expect(app.make('model')).toBeInstanceOf(ModelFacade);

        expect(mockAxios.get).toHaveBeenCalledWith('/luminix-api/init');

    });

    test('facades can be added', async () => {
        const app = new App();

        app.bind('foo', () => 'bar');
        
        expect(app.make('foo')).toBe('bar');
    });

    /**
     * @toReview
     */
    // test.skip('plugins can replace facades', async () => {
    //     const app = new App();
    //     const auth = {} as FacadeOf<AuthFacade, HasFacadeAccessor>;

    //     const plugin: Plugin = {
    //         name: 'test',
    //         register(application: AppFacade) {
    //             application.bind('auth', () => auth);
    //         },
    //         boot() {
    //         }
            
    //     };

    //     app.on('init', ({ register }) => {
    //         register(plugin);
    //     });

    //     app.create();

    //     expect(app.make('auth')).toBe(auth);
    // });

    test('facades cant be replaced after boot', async () => {
        const app = new App([ TestServiceProvider ]);

        app.create();

        const Test = MakeFacade<TestService, TestFacadeClass>(TestFacadeClass, app);
        
        app.bind('auth', () => ({} as AuthFacade));

        expect(app.make('auth')).toBeInstanceOf(Auth);
        expect(Test.foo()).toBe(1);
    });

    test('boot method actions are running', async () => {
        const app = new App();

        const init = jest.fn();
        const booting = jest.fn();
        const booted = jest.fn();


        app.on('init', init);
        app.on('booting', booting);
        app.on('booted', booted);

        app.create();

        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledWith({ 
            source: app,
            register: expect.any(Function) 
        });

        expect(booting).toHaveBeenCalledTimes(1);
        expect(booting).toHaveBeenCalledWith({ 
            source: app,
        });

        expect(booted).toHaveBeenCalledTimes(1);
        expect(booted).toHaveBeenCalledWith({ 
            source: app,
        });
    });

});
