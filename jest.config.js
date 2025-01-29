
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
    // moduleDirectories: [
    //     'node_modules'
    // ],
    // modulePaths: [
    //     '<rootDir>'
    // ],
    // moduleNameMapper: {
    //     '@luminix/support': require.resolve('@luminix/support'),
    // },
};
