import { Model } from '../types/Model';
import { ModelFacade } from '../types/App';

import app from './app';

function model(): ModelFacade;
function model(abstract: string): typeof Model;

function model(abstract?: string) {
    const modelFacade = app('model');
    if (!abstract) {
        return modelFacade;
    }

    return modelFacade.make(abstract);
}

export default model;
