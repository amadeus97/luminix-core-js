

import { HasFacadeAccessor, MakeFacade } from '@luminix/support';
import AuthService from '../services/AuthService';
import App from './App';

class AuthFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'auth';    
    }
}

const Auth = MakeFacade<AuthService, AuthFacade>(AuthFacade, App);

export default Auth;
