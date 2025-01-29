
import { Collection } from '@luminix/support';

// import { collect } from '../'; // @luminix/core
// import { collect } from '../src/contracts/Collection';

beforeEach(() => {
    jest.resetModules();
});

function collect<T = unknown>(items: T[]) {
    return new Collection(items);
}

describe('collection test', () => {

    const collection = collect([
        { name: 'iPhone 6', brand: 'Apple', type: 'phone', released: 2014 },
        { name: 'iPhone 5', brand: 'Apple', type: 'phone', released: 2012 },
        { name: 'Apple Watch', brand: 'Apple', type: 'watch', released: 2015 },
        { name: 'Galaxy S6', brand: 'Samsung', type: 'phone', released: 2015 },
        { name: 'Galaxy Gear', brand: 'Samsung', type: 'watch', released: 2013 },
    ]);

    test('collection pluck', () => {
        const result = collection.pluck('name').all();
        expect(result).toEqual(['iPhone 6', 'iPhone 5', 'Apple Watch', 'Galaxy S6', 'Galaxy Gear']);
    });

    test('collection where', () => {
        const result = collection.where('brand', 'Apple').all();
        expect(result).toEqual([
            { name: 'iPhone 6', brand: 'Apple', type: 'phone', released: 2014 },
            { name: 'iPhone 5', brand: 'Apple', type: 'phone', released: 2012 },
            { name: 'Apple Watch', brand: 'Apple', type: 'watch', released: 2015 },
        ]);

        const result2 = collection.where('brand', '!=', 'Apple').all();
        expect(result2).toEqual([
            { name: 'Galaxy S6', brand: 'Samsung', type: 'phone', released: 2015 },
            { name: 'Galaxy Gear', brand: 'Samsung', type: 'watch', released: 2013 },
        ]);

        const result3 = collection.where('released', '>', 2013).all();
        expect(result3).toEqual([
            { name: 'iPhone 6', brand: 'Apple', type: 'phone', released: 2014 },
            { name: 'Apple Watch', brand: 'Apple', type: 'watch', released: 2015 },
            { name: 'Galaxy S6', brand: 'Samsung', type: 'phone', released: 2015 },
        ]);

        const result4 = collection.where('released', '>=', 2014).first();
        expect(result4).toEqual({ name: 'iPhone 6', brand: 'Apple', type: 'phone', released: 2014 });

        const result5 = collection.where('released', '<', 2014)
            .where('type', 'phone')
            .all();


        expect(result5).toEqual([{ name: 'iPhone 5', brand: 'Apple', type: 'phone', released: 2012 }]);
    });

    test('collection unique', () => {
        const result = collection.unique('brand').all();
        expect(result).toEqual([
            { name: 'iPhone 6', brand: 'Apple', type: 'phone', released: 2014 },
            { name: 'Galaxy S6', brand: 'Samsung', type: 'phone', released: 2015 },
        ]);
    });
    
});
