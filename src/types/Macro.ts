
export type MacroActionCallback = (...params: any[]) => void;

export type MacroFilterCallback<T, U> = (value: T, ...params: any[]) => T | U;

export interface Action {
    action: string,
    callback: MacroActionCallback,
    priority: number,
}

export interface Filter<T, U> {
    filter: string,
    callback: MacroFilterCallback<T, U>,
    priority: number,
}

export type MacroFacade = {
    addAction(action: string, callback: MacroActionCallback, priority?: number): void;
    addFilter<T, U>(filter: string, callback: MacroFilterCallback<T, U>, priority?: number): void;
    doAction(action: string, ...params: any[]): void;
    applyFilters<T, U>(filter: string, value: T, ...params: any[]): U;
    removeAction(action: string, callback: MacroActionCallback): void;
    removeFilter<T, U>(filter: string, callback: MacroFilterCallback<T, U>): void;
    getActions(filter?: string): ActionRepository;
    getFilters(filter?: string): FilterRepository<any, any>;
    hasAction(action: string): boolean;
    hasFilter(filter: string): boolean;
    clearActions(action: string): void;
    clearFilters(filter: string): void;

};

export type ActionRepository = Array<Action>;

export type FilterRepository<T, U> = Array<Filter<T, U>>;
