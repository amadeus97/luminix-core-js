
const reader = (name: string) => {
    if (!document.querySelector('#luminix-embed')) {
        throw new Error('[Luminix] Embed element not found. Make sure to include the `@luminixEmbed()` directive in your Blade template.');
    }

    const element: HTMLDivElement | null = document.querySelector('div#luminix-data-' + name);

    if (!element) {
        return null;
    }

    if (element.dataset.json && element.dataset.value) {
        return JSON.parse(element.dataset.value);
    }

    return element.dataset.value;
};

export default reader;

