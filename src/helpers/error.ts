import { ErrorFacade } from '../types/Error';
import app from './app';


export default function error(): ErrorFacade;
export default function error(key: string): string | null;
export default function error(key?: string): ErrorFacade | string | null {
    if (key) {
        return app().make('error').get(key);
    }
    return app().make('error');
}
