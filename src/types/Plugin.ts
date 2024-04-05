

export type PluginInterface<A,F> = {
    register(app: A): void;
    boot(facades: F): void;


}



