

export const createMergedSearchParams = (...urls: string[]): URLSearchParams => {
    const searchParams = new URLSearchParams();
    urls.forEach((url) => {
        const [, ...search] = url.split('?');
        const params = new URLSearchParams(search.join(''));
        params.forEach((value, key) => {
            searchParams.set(key, value);
        });
    });

    return searchParams;
};




