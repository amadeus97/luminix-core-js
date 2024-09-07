import { ServiceProvider } from '@luminix/support';

import ModelService from '../services/ModelService';

export default class ModelServiceProvider extends ServiceProvider
{
    register(): void {
        this.app.singleton('model', () => {
            return new ModelService(
                this.app.configuration.manifest?.models ?? {},
            );
        });
    }
}

