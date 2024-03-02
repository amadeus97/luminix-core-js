
export default {
    transform: {
        // '^.+\\.ts?$': 'ts-jest',
        // use babel for js
        '^.+\\.js?$': 'babel-jest',
        '^.+\\.ts?$': 'ts-jest',
    },
    testEnvironment: 'jsdom',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'js'],
    
}


