
import { axios } from '@luminix/support';

jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;

// const mockAxios = {
//     get: (options: Record<string, unknown>) => jest.fn(() => {
//         if (options.url === '/something') {
//             return Promise.resolve({ 
//                 data: options.resolve, 
//                 status: options.status 
//             });
//         }
//     }),
//     post: (options: Record<string, unknown>) => jest.fn(() => {
//         if (options.url === '/something') {
//             return Promise.resolve({ 
//                 data: options.resolve, 
//                 status: options.status 
//             });
//         }
//     }),
//     put: (options: Record<string, unknown>) => jest.fn(() => {
//         if (options.url === '/something') {
//             return Promise.resolve({ 
//                 data: options.resolve, 
//                 status: options.status 
//             });
//         }
//     }),
//     patch: (options: Record<string, unknown>) => jest.fn(() => {
//         if (options.url === '/something') {
//             return Promise.resolve({ 
//                 data: options.resolve, 
//                 status: options.status 
//             });
//         }
//     }),
//     delete: (options: Record<string, unknown>) => jest.fn(() => {
//         if (options.url === '/something') {
//             return Promise.resolve({ 
//                 data: options.resolve, 
//                 status: options.status 
//             });
//         }
//     }),
// };

export default mockAxios;
