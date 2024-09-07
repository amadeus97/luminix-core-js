import { HasFacadeAccessor, MakeFacade } from '@luminix/support';

import { ModelService } from '../services/ModelService';
import App from './App';

class ModelFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'model';    
    }
}

const Model = MakeFacade<ModelService, ModelFacade>(ModelFacade, App);

export default Model;
