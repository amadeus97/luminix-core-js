import { HasFacadeAccessor, MakeFacade, ReducibleInterface } from '@luminix/support';

import { ModelService } from '../services/ModelService';
import App from './App';
import { ModelReducers } from '../types/Model';

class ModelFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'model';    
    }
}

const Model = MakeFacade<ModelService & ModelReducers & ReducibleInterface<ModelReducers>, ModelFacade>(ModelFacade, App);

export default Model;
