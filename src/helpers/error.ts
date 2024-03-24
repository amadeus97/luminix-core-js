import { ErrorFacade } from '../types/Error';
import app from './app';


export default function error(): ErrorFacade;
export default function error(key: string, bag?: string): string | null;
export default function error(key?: string, bag = 'default'): ErrorFacade | string | null {
    if (key) {
        return app().make('error').get(key, bag);
    }
    return app().make('error');
}
