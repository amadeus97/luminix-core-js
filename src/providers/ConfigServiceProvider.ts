import { Obj, PropertyBag, ServiceProvider } from '@luminix/support';


export default class ConfigServiceProvider extends ServiceProvider
{

    register(): void {

        this.app.singleton('config', () => {
            const config = new PropertyBag(Obj.omit(this.app.configuration, 'manifest'));

            if (!config.has('auth.user')) {
                config.set('auth.user', null);
            }

            config.lock('auth.user');

            return config;
        });

    }

}

