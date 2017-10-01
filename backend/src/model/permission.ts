export enum Permission {
    getAccounts,
    setAccountDetails,
    resetPasswords,
    setPermissions,
}

export function defaultPermissions(): Permission[] {
    return [];
}

export default Permission;
