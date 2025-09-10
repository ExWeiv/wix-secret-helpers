import NodeCache from '@cacheable/node-cache';
import { auth } from '@wix/essentials';
import { secrets } from '@wix/secrets';
import { fromPromise, Result, ok, err } from 'neverthrow';

const PREFIX = "Secret Helpers Error:"
const secretsCache = new NodeCache<string>({ stdTTL: 360, deleteOnExpire: true, checkperiod: 120 });
const parsedCache = new NodeCache<unknown>({ stdTTL: 360, deleteOnExpire: true, checkperiod: 120 });

export interface GetSecretValueOptions {
    secretName: string,
    parseJSON?: boolean,
    cacheEnabled?: boolean,
    elevateAccess?: boolean
}

export async function getSecretValue<T = { [key: string]: any }>(options: Omit<GetSecretValueOptions, 'parseJSON'> & { parseJSON: false }): Promise<string>;
export async function getSecretValue<T = { [key: string]: any }>(options: Omit<GetSecretValueOptions, 'parseJSON'> & { parseJSON: true }): Promise<T>;
export async function getSecretValue<T = { [key: string]: any }>(options: GetSecretValueOptions): Promise<string | T>;

/**
 * @description
 * Get secret value with optional caching and JSON parsing. Easy caching for secrets with a max lifespan of 6 minutes which is defined by Wix's container rules.
 * When container of the site backend is killed your cache will be lost, so keep that in mind when you use this helper.
 * 
 * @param options Configuration options for getting the secret.
 * @param options.secretName Secret name defined in Wix's Secret Manager.
 * @param options.cacheEnabled Enable or disable memory caching, enabled (true) by default.
 * @param options.parseJSON Enable or disable JSON parsing for JSON type secrets, because they are stored as strings.
 * @param options.elevateAccess Enable or disable elevated access for the secret request, enabled (true) by default.
 * @returns Promise that resolves to the secret value (string or parsed JSON object).
 * 
 * Example usage:
 * ```typescript
 * // To get a plain text secret
 * const secretValue = await getSecretValue({ secretName: 'mySecretName' });
 * console.log('Secret Value:', secretValue);
 * ```
 * 
 * @example
 * ```typescript
 * // To get a JSON secret and parse it automatically
 * const jsonSecret = await getSecretValue<{ apiKey: string, apiSecret: string }>({
 *   secretName: 'myJsonSecretName',
 *   parseJSON: true
 * });
 * 
 * console.log('API Key:', jsonSecret.apiKey);
 * console.log('API Secret:', jsonSecret.apiSecret);
 * ```
 */
export async function getSecretValue<T = { [key: string]: any }>({
    secretName,
    elevateAccess = true,
    cacheEnabled = true,
    parseJSON = false
}: GetSecretValueOptions): Promise<string | T> {
    if (!secretName) {
        throw new Error(`${PREFIX} secretName must be a valid string value!`);
    }

    if (cacheEnabled === false) {
        const response = await getSecret<T>(secretName, parseJSON, elevateAccess);

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
        const response = await getSecret<T>(secretName, parseJSON, elevateAccess);

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

async function getSecret<T = { [key: string]: any }>(secretName: string, parseJSON: false, elevateAccess?: boolean): Promise<Result<string, Error>>;
async function getSecret<T = { [key: string]: any }>(secretName: string, parseJSON: true, elevateAccess?: boolean): Promise<Result<T, Error>>;
async function getSecret<T = { [key: string]: any }>(secretName: string, parseJSON: boolean, elevateAccess?: boolean): Promise<Result<string | T, Error>>;

async function getSecret<T = { [key: string]: any }>(
    secretName: string,
    parseJSON = false,
    elevateAccess = true
): Promise<Result<string | T, Error>> {
    const getSecretValue = elevateAccess ? auth.elevate(secrets.getSecretValue) : secrets.getSecretValue;
    const wixSecretResponse = await fromPromise(
        getSecretValue(secretName),
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