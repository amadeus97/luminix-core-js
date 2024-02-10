import { ActionRepository, FilterRepository, MacroActionCallback, MacroFacade, MacroFilterCallback } from '../types/Macro';
/**
 * Macro Container
 */
export default class Macro implements MacroFacade {

    private actions: ActionRepository = [];
    private filters: FilterRepository<any, any> = [];

    addAction(action: string, callback: MacroActionCallback, priority: number = 10) {
        this.actions.push({ action, callback, priority });
    }

    addFilter<T, U>(filter: string, callback: MacroFilterCallback<T, U>, priority: number = 10) {
        this.filters.push({ filter, callback, priority });
    }

    doAction(action: string, ...args: any[]): void {
        const actions = this.actions.filter((item) => item.action === action);
        actions.sort((a, b) => a.priority - b.priority);
        actions.forEach((item) => item.callback(...args));
    }

    applyFilters(filter: string, value: any, ...args: any[]): any {
        const filters = this.filters.filter((item) => item.filter === filter);
        // filters;
        return filters
            .sort((a, b) => a.priority - b.priority)
            .reduce((value, item) => item.callback(value, ...args), value);
    }

    removeAction(action: string, callback: MacroActionCallback) {
        // this.actions = this.actions.filter((item) => item.action !== action || item.callback !== callback);
        this.actions.splice(this.actions.findIndex((item) => item.action === action && item.callback === callback), 1);
    }

    removeFilter(filter: string, callback: MacroFilterCallback<any, any>) {
        // this.filters = this.filters.filter((item) => item.filter !== filter || item.callback !== callback);
        this.filters.splice(this.filters.findIndex((item) => item.filter === filter && item.callback === callback), 1);
    }

    getActions(action?: string): Array<any> {
        if (action) {
            return this.actions.filter((item) => item.action === action);
        }
        return this.actions;
    }

    getFilters(filter?: string): Array<any> {
        if (filter) {
            return this.filters.filter((item) => item.filter === filter);
        }
        return this.filters;
    }

    hasFilter(filter: string): boolean {
        return this.filters.some((item) => item.filter === filter);
    }

    hasAction(action: string): boolean {
        return this.actions.some((item) => item.action === action);
    }

    clearActions(action: string) {
        while (this.hasAction(action)) {
            this.actions.splice(this.actions.findIndex((item) => item.action === action), 1);
        }
    }

    clearFilters(filter: string) {
        while (this.hasFilter(filter)) {
            this.filters.splice(this.filters.findIndex((item) => item.filter === filter), 1);
        }
    }

}


