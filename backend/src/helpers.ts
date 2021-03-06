import * as _ from 'lodash';
import * as Bromise from 'bluebird';
import Signals = NodeJS.Signals;


export const stopSignals: Signals[] = ['SIGINT', 'SIGTERM'];

export class MultipleErrors extends Error {

    public static build(errors: Error[], flatten: Boolean = true): Error|null {
        if (errors.length === 0) {
            return null;
        }

        if (errors.length === 1) {
            return errors[0];
        }

        return new MultipleErrors(flatten ? MultipleErrors.flatten(errors) : errors);
    }

    private static flatten(errors: Error[]): Error[] {
        const errs: Error[] = [];

        errors.forEach((err) => {
            if (err instanceof MultipleErrors) {
                errs.push(...MultipleErrors.flatten(err.errors));
            }
            else {
                errs.push(err);
            }
        });

        return errs;
    }

    private constructor(public errors: Error[]) {
        super(
            [
                'Multiple errors occurred:',
                ...errors.map((err, i) => `  ${i}. ${err.toString()}`)
            ].join('\n')
        );
    }
}


export async function robustJoin(...promises: (Promise<any>|Bromise<any>)[]) {
    const
        results = [],
        errors: Error[] = [];

    for (const p of promises) {
        try {
            results.push(await p);
        }
        catch (err) {
            errors.push(err);
        }
    }

    const error = MultipleErrors.build(errors);
    if (error) {
        throw error;
    }

    return results;
}


export class Counter<T> {

    private map: Map<T, number> = new Map();

    public add(value: T): number {
        this.map.set(value, this.get(value) + 1);

        return this.get(value);
    }

    public get(value: T): number {
        return this.map.get(value) || 0;
    }

    public entries(): Iterable<[T, number]> {
        return this.map.entries();
    }

    public forEach(callback: (key: T, count: number) => void) {
        return this.map.forEach((count, key) => callback(key, count));
    }
}


export function getFloat(name: string, defaultValue: number = null): number {
    const value = process.env[name];

    if (value) {
        const float = parseFloat(value);
        if (_.isNaN(float)) {
            throw new Error(`The "${name}" environment variable should be a float, instead it is: "${value}"`);
        }

        return float;
    }
    else if (defaultValue !== null) {
        return defaultValue;
    }
    else {
        throw new Error(`The ${name} environment variable is missing`);
    }
}


export function getInteger(name: string, defaultValue: number = null): number {
    const value = process.env[name];

    if (value) {
        const integer = parseInt(value);
        if (_.isNaN(integer)) {
            throw new Error(`The "${name}" environment variable should be an integer, instead it is: "${value}"`);
        }

        return integer;
    }
    else if (defaultValue !== null) {
        return _.floor(defaultValue);
    }
    else {
        throw new Error(`The ${name} environment variable is missing`);
    }
}


export function getString(name: string, defaultValue: string = null): string {
    const value = process.env[name];

    if (value) {
        return value;
    }
    else if (defaultValue !== null) {
        return defaultValue;
    }
    else {
        throw new Error(`The "${name}" environment variable is missing`);
    }
}


export function getBoolean(
    name: string,
    defaultValue: boolean = null,
    trueValues = ['1', 'true'],
    falseValues = ['0', 'false']
): boolean {
    const value = (process.env[name] || '').toLowerCase();

    if (value) {
        if (trueValues.includes(value)) {
            return true;
        }
        else if (falseValues.includes(value)) {
            return false;
        }
        else {
            throw new Error(`The "${name}" environment variable should be a boolean, instead it is "${value}"`);
        }
    }
    else if (defaultValue !== null) {
        return defaultValue;
    }
    else {
        throw new Error(`The "${name}" environment variable is missing`);
    }
}
