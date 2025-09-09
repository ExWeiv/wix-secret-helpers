export declare function getSecretValue<T = {
    [key: string]: any;
}>(secretName: string, parseJSON?: boolean, cacheEnabled?: boolean): Promise<string | T>;
export declare function getSecretValue<T = {
    [key: string]: any;
}>(secretName: string, parseJSON?: false, cacheEnabled?: boolean): Promise<string>;
export declare function getSecretValue<T = {
    [key: string]: any;
}>(secretName: string, parseJSON?: true, cacheEnabled?: boolean): Promise<T>;
declare const _default: {
    getSecretValue: typeof getSecretValue;
};
export default _default;
