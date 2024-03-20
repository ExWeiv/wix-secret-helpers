/**
 * Library that works with Velo wix-secrets-backend.v2 APIs to add some helpers functions like caching.
 * Designed for Wix websites.
 */
declare module '@exweiv/wix-secret-helpers' {
    /**
     * This API is cache enabled by default so when you use this API you'll get the same value as string
     * but after it runs for the first time it'll save the value to cache so next time you call it the API will get the value
     * from cache instead of using wix-secrets-backen.v2 APIs.
     * 
     * !! Also keep in mind that this function is elevated with `wixAuth` so it can be valled by any site visitor. 
     * 
     * @function
     * @param secretName Secret name in Wix Secrets Manager (same name when you use Wix secrets APIs)
     * @param disableCache By default set to false if set to true function will directly get the secret from naitve Wix APIs
     * 
     * @example
     * ```js
     * import { getSecretValue } = '@exweiv/wix-secret-helpers';
     * 
     * // get secret value with cache enabled:
     * const secret = await getSecretValue("secretName");
     * 
     * // disable cache
     * const secret = await getSecretValue("secretName", true);
     * 
     * // handle secret value
     * ```
     */
    function getSecretValue(secretName: string, disableCache?: boolean): Promise<string>;
}