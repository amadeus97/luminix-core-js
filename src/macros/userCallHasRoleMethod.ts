import { Model } from "../types/Model";

export default (_: Function, user: Model) => (role: string|string[]) => {
    if (!user.relations.roles) {
        console.warn('User has no roles.');
        console.log({ user, role });
        return false;
    }
    if (Array.isArray(role)) {
        return (user.relations.roles as any[]).some((userRole: Model) => role.includes(userRole.name));
    }
    return (user.relations.roles as any[]).some((userRole: Model) => userRole.name === role);
};
