import { Model } from "./Model";


export type AuthCredentials = {
    email: string;
    password: string;
};

export type AuthFacade = {
    attempt(credentials: AuthCredentials, remember: boolean): Promise<any>;
    check(): boolean;
    logout(): void;
    user(): Model | null;
};

