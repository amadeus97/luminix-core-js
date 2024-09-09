import { Model } from '../types/Model';
import { AppContainers } from '../types/App';

import app from './app';

function model(): AppContainers['model'];
function model(abstract: string): typeof Model;
function model(abstract?: string) {
    const modelFacade = app('model');
    if (!abstract) {
        return modelFacade;
    }

    return modelFacade.make(abstract);
}

export default model;
