
export default {
    moduleFileExtensions: [ 'ts', 'js' ],
    testEnvironment: 'jsdom',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
    transform: {
        '^.+\\.js?$': 'babel-jest',
        '^.+\\.ts?$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!nanoevents|lodash-es)',
    ],
};
