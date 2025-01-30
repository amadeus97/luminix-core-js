
import { axios } from '@luminix/support';

const {
    AxiosHeaders,
    AxiosError,
    isAxiosError,
} = axios;

// const axios = jest.fn();

jest.mock('axios');
// jest.mock('axios', () => ({ axios }));

export {
    AxiosHeaders,
    AxiosError,
    isAxiosError,
};

export default axios;
