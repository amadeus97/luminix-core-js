import NoEmbedException from '../exceptions/NoEmbedException';

const reader = (name: string, type: 'data' | 'error' = 'data') => {
    if (!document.querySelector('#luminix-embed')) {
        throw new NoEmbedException();
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

