
export default class NoEmbedException extends Error {

    static name = 'NoEmbedException';

    constructor() {
        super('[Luminix] Embed element not found. Make sure to include the `@luminixEmbed()` directive in your Blade template.');
    }

}