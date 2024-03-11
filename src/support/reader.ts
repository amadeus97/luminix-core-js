
const reader = (name: string, type: 'data' | 'error' = 'data') => {
    if (!document.querySelector('#luminix-embed')) {
        throw new Error('[Luminix] Embed element not found. Make sure to include the `@luminixEmbed()` directive in your Blade template.');
    }

    const element: HTMLElement | null = document.getElementById(`luminix-${type}::` + name);

    if (!element) {
        return null;
    }

    if (element.dataset.json && element.dataset.value) {
        return JSON.parse(element.dataset.value);
    }

    return element.dataset.value;
};

export default reader;

