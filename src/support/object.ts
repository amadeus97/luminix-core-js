
// import _ from 'lodash';
import { diff } from 'deep-object-diff';

export const createObjectWithKeys = (keys: Array<string>, obj: any) => Object.keys(obj)
    .filter((key) => keys.includes(key))
    .reduce((acc: any, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});

export const createObjectWithoutKeys = (keys: Array<string>, obj: any) => Object.keys(obj)
    .filter((key) => !keys.includes(key))
    .reduce((acc: any, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});

export const objectDiff = (original: any, modified: any) => {
    try {
        return diff(original, modified);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('objectDiff error: ', error);
        return false;
    }
};

export const objectGetByPath = (object: any, path: string) => {
    try {
        if (!object) {
            return undefined;
        }
        return path.split('.').reduce((acc, key) => {
            if (!acc) {
                return undefined;
            }
            return acc[key]
        }, object);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        return undefined;
    }
};

export const objectSetByPath = (obj: any, path: string, value: any) => {
    try {
        const pathArray = path.split('.'); // user.name.first
        const lastKey = pathArray.pop(); // first || pathArray = ['user', 'name']
        // const lastObj = pathArray.reduce((acc, key) => acc[key], obj);

        if (!lastKey) {
            return obj;
        }

        const lastObj = pathArray.reduce((acc, key) => {
            if (!acc[key]) {
                acc[key] = {};
            }
            return acc[key];
        }, obj);
        lastObj[lastKey] = value;
        return obj;
    } catch (error) {
        console.error(error);
        return obj;
    }
};

export const objectExistsByPath = (obj: any, path: string) => {
    try {
        return objectGetByPath(obj, path) !== undefined;
    } catch (error) {
        return false;
    }
};
