
export default (cast: string) => (original: any) => {
    if (original === null || original === undefined) {
        return original;
    }
    
    if (cast === 'boolean') {
        return !!original;
    }
    if (['date', 'datetime', 'immutable_date', 'immutable_datetime'].includes(cast)) {
        return new Date(original);
    }
    if (
        ['float', 'double', 'integer'].includes(cast)
        || cast.startsWith('decimal:')
    ) {
        return Number(original);
    }

    return original;
};
