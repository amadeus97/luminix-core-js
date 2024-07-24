import { AuthFacade } from '../types/Auth';
import app from './app';

export default function (): AuthFacade {
    return app('auth');
} 

