
import { HasFacadeAccessor, MakeFacade } from '@luminix/support';

import App from './App';

import AuthService from '../services/AuthService';

class AuthFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'auth';    
    }
}

const Auth = MakeFacade<AuthService, AuthFacade>(AuthFacade, App);

export default Auth;
