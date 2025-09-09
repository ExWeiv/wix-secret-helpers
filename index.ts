import NodeCache from '@cacheable/node-cache';
import { auth } from '@wix/essentials';
import { secrets } from '@wix/secrets';
import { fromPromise, Result, ok, err } from 'neverthrow';

const PREFIX = "Secret Helpers Error:"
const secretsCache = new NodeCache<string>({ stdTTL: 360, deleteOnExpire: true, checkperiod: 120 });
const parsedCache = new NodeCache<unknown>({ stdTTL: 360, deleteOnExpire: true, checkperiod: 120 });

export async function getSecretValue<T = { [key: string]: any }>(
    secretName: string,
    parseJSON?: boolean,
    cacheEnabled?: boolean,
): Promise<string | T>;
export async function getSecretValue<T = { [key: string]: any }>(
    secretName: string,
    parseJSON?: false,
    cacheEnabled?: boolean,
): Promise<string>;
export async function getSecretValue<T = { [key: string]: any }>(
    secretName: string,
    parseJSON?: true,
    cacheEnabled?: boolean,
): Promise<T>;

/**
 * @description
 * Get secret value with optional caching and JSON parsing. Easy caching for secrets with a max lifespan of 6 minutes which is defined by Wix's container rules.
 * When container of the site backend is killed your cache will be lost, so keep that in mind when you use this helper.
 * 
 * @param secretName Secret name defined in Wix's Secret Manager
 * @param cacheEnabled Enable or disable memory caching, enabled (true) by default. You can set it false to disable caching for container lifespan (max of 6min).
 * @param parseJSON Enable or disable JSON parsing, if your secret is a JSON string you can set this to true and get JS object as return value.
 * @returns It returns a `Promise` that resolves to the secret value, which can be a string or a parsed JSON object based on the `parseJSON` parameter.
 * 
 * Example usage:
 * ```typescript
 * import { getSecretValue } from '@exweiv/wix-secret-helpers';
 * 
 * // To get a plain text secret
 * const secretValue = await getSecretValue('mySecretName');
 * console.log('Secret Value:', secretValue);
 * 
 * // To get a JSON secret and parse it automatically
 * const jsonSecret = await getSecretValue<{ apiKey: string, apiSecret: string }
 * console.log('API Key:', jsonSecret.apiKey);
 * console.log('API Secret:', jsonSecret.apiSecret);
 * ```
 */
export async function getSecretValue<T = { [key: string]: any }>(
    secretName: string,
    parseJSON = false,
    cacheEnabled = true
): Promise<string | T> {
    if (!secretName) {
        throw new Error(`${PREFIX} secretName must be a valid string value!`);
    }

    if (cacheEnabled === false) {
        const response = await getSecret<T>(secretName, parseJSON);

        if (response.isOk()) {
            return response.value;
        } else {
            throw new Error(response.error.message);
        }
    }

    const cachedSecret = secretsCache.get(secretName);
    if (cachedSecret) {
        const response = parseJSON ? returnWithParse<T>(cachedSecret, secretName) : ok(cachedSecret);

        if (response.isOk()) {
            return response.value;
        } else {
            throw new Error(response.error.message);
        }
    } else {
        const response = await getSecret<T>(secretName, parseJSON);

        if (response.isOk()) {
            return response.value;
        } else {
            throw new Error(response.error.message);
        }
    }
}

function returnWithParse<T>(jsonString: string, secretName: string): Result<T, Error> {
    try {
        if (parsedCache.has(secretName)) {
            const cachedParsed = parsedCache.get(secretName);
            return ok(cachedParsed as T);
        }

        const parsed = JSON.parse(jsonString);
        parsedCache.set(secretName, parsed);
        return ok(parsed as T);
    } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error(String(e));
        return err(error);
    }
}


async function getSecret<T = { [key: string]: any }>(
    secretName: string,
    parseJSON: false
): Promise<Result<string, Error>>;
async function getSecret<T = { [key: string]: any }>(
    secretName: string,
    parseJSON: true
): Promise<Result<T, Error>>;
async function getSecret<T = { [key: string]: any }>(
    secretName: string,
    parseJSON: boolean
): Promise<Result<string | T, Error>>;

async function getSecret<T = { [key: string]: any }>(
    secretName: string,
    parseJSON = false
): Promise<Result<string | T, Error>> {
    const elevatedGetSecretValue = auth.elevate(secrets.getSecretValue);
    const wixSecretResponse = await fromPromise(
        elevatedGetSecretValue(secretName),
        (e) => (e instanceof Error ? e : new Error(String(e)))
    );

    if (wixSecretResponse.isOk()) {
        const { value } = wixSecretResponse.value;

        if (!value) {
            return err(new Error(`${PREFIX} secret value is undefined! Response from Wix: ${value}`));
        }

        secretsCache.set(secretName, value);

        if (parseJSON) {
            return returnWithParse<T>(value, secretName);
        } else {
            return ok(value);
        }
    } else {
        return err(new Error(`${PREFIX} unable to get the secret value from Wix!\n ${wixSecretResponse.error.message}`));
    }
}

export default { getSecretValue };