
import * as Support from '@luminix/support';

/* * */

// const {
//     AxiosHeaders,
//     AxiosError,
//     isAxiosError,
// } = Support.axios;

// const axios = jest.fn();

/* * */

// jest.mock('axios');

// jest.mock('@luminix/support', () => ({
//     ...Support,
//     axios: jest.fn(),
// }));

jest.mock('@luminix/support', () => ({
    axios: jest.fn(),
}));

/* * */

// export {
//     AxiosHeaders,
//     AxiosError,
//     isAxiosError,
// };

export default Support.axios;
