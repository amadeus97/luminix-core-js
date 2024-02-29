import { AppFacade } from '..';
import { MacroFacade, MacroReducer, Reducer } from '../types/Macro';

export default class Macro implements MacroFacade {
    private macros: {
        [name: string]: Reducer[]
    } = {};

    constructor(
        private readonly app: AppFacade
    ) {
    }

    add(name: string, callback: MacroReducer, priority: number = 10) {
        if (!this.macros[name]) {
            this.macros[name] = [];
        }
        this.macros[name] = [
            ...this.macros[name],
            { callback, priority }
        ].sort((a, b) => a.priority - b.priority);
    }

    reduce(name: string, value: any, ...args: any[]): any {
        const { [name]: macros = [] } = this.macros;

        const { config, log } = this.app.make();

        return macros.reduce((prevValue, item) => {
            const nextValue = item.callback(prevValue, ...args);
            if (config.get('app.debug', false) && typeof prevValue !== undefined && typeof nextValue === 'undefined') {
                log.warning(
                    `[Luminix] Macro reducer for '${name}' returned undefined.
This may be the desired behavior, but most probably it's a mistake.
Always return the original value if no change is needed, or 'null' if the value should be removed.`
                );
            }
            return nextValue;
        }, value);
    }

    remove(name: string, callback: MacroReducer) {
        const index = this.macros[name].findIndex((item) => item.callback === callback)
        if (index === -1) {
            const { config, log } = this.app.make();

            if (config.get('app.debug', false)) {
                log.warning(`[Luminix] Unable to remove macro. Macro reducer for '${name}' not found.`);
            }
            return;
        }
        this.macros[name].splice(index, 1);
    }

    get(name?: string): Reducer[] {
        if (name) {
            return this.macros[name];
        }
        return Object.values(this.macros).reduce((acc, reducers) => {
            return [
                ...acc,
                ...reducers,
            ];
        }, []);
    }

    has(name: string): boolean {
        return !!this.macros[name] && this.macros[name].length > 0;
    }

    clear(name: string) {
        this.macros[name] = [];
    }

}


