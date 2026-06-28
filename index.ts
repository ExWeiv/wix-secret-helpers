import NodeCache from "@cacheable/node-cache";
import { auth } from "@wix/essentials";
import { secrets } from "@wix/secrets";
import { fromPromise, Result, ok, err } from "neverthrow";

const PREFIX = "Secret Helpers Error:";
const secretsCache = new NodeCache<string>({
  stdTTL: 360,
  deleteOnExpire: true,
  checkperiod: 120,
});
const parsedCache = new NodeCache<unknown>({
  stdTTL: 360,
  deleteOnExpire: true,
  checkperiod: 120,
});

export interface GetSecretValueOptions {
  parseJSON?: boolean;
  cacheEnabled?: boolean;
  elevateAccess?: boolean;
}

export async function getSecretValue<T = Record<string, any>>(
  secretName: string,
  options?: Omit<GetSecretValueOptions, "parseJSON"> & { parseJSON: false },
): Promise<string>;
export async function getSecretValue<T = Record<string, any>>(
  secretName: string,
  options?: Omit<GetSecretValueOptions, "parseJSON"> & { parseJSON: true },
): Promise<T>;
export async function getSecretValue<T = Record<string, any>>(
  secretName: string,
  options?: GetSecretValueOptions,
): Promise<string | T>;

/**
 * @description
 * Get secret value with optional caching and JSON parsing. Easy caching for secrets with a max lifespan of 6 minutes which is defined by Wix's container rules.
 * When container of the site backend is killed your cache will be lost, so keep that in mind when you use this helper.
 *
 * @param secretName Secret name defined in Wix's Secret Manager.
 * @param options Optional configuration for the request.
 * @param options.cacheEnabled Enable or disable memory caching, enabled (true) by default.
 * @param options.parseJSON Enable or disable JSON parsing for JSON type secrets, because they are stored as strings.
 * @param options.elevateAccess Enable or disable elevated access for the secret request, enabled (true) by default.
 * @returns Promise that resolves to the secret value (string or parsed JSON object).
 *
 * Example usage:
 * ```typescript
 * // To get a plain text secret
 * const secretValue = await getSecretValue('mySecretName');
 * console.log('Secret Value:', secretValue);
 * ```
 *
 * @example
 * ```typescript
 * // To get a JSON secret and parse it automatically
 * const jsonSecret = await getSecretValue<{ apiKey: string, apiSecret: string }>('myJsonSecretName', {
 *   parseJSON: true
 * });
 *
 * console.log('API Key:', jsonSecret.apiKey);
 * console.log('API Secret:', jsonSecret.apiSecret);
 * ```
 */
export async function getSecretValue<T = Record<string, any>>(
  secretName: string,
  {
    elevateAccess = true,
    cacheEnabled = true,
    parseJSON = false,
  }: GetSecretValueOptions = {},
): Promise<string | T> {
  if (typeof secretName !== "string" || secretName.trim() === "") {
    const error = new Error(
      `${PREFIX} secretName must be a non-empty string!`,
    );
    throw error;
  }

  const useCache = cacheEnabled !== false;

  if (!useCache) {
    const response = await getSecret<T>(
      secretName,
      parseJSON,
      elevateAccess,
      false,
    );
    if (response.isOk()) {
      return response.value;
    }
    throw response.error;
  }

  const cachedSecret = secretsCache.get(secretName);
  if (cachedSecret) {
    const result = parseJSON
      ? returnWithParse<T>(cachedSecret, secretName)
      : ok(cachedSecret);
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  const response = await getSecret<T>(
    secretName,
    parseJSON,
    elevateAccess,
    true,
  );
  if (response.isOk()) {
    return response.value;
  }
  throw response.error;
}

function returnWithParse<T>(
  jsonString: string,
  secretName: string,
): Result<T, Error> {
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

async function getSecret<T = Record<string, any>>(
  secretName: string,
  parseJSON = false,
  elevateAccess = true,
  writeCache = true,
): Promise<Result<string | T, Error>> {
  const getSecretValue = elevateAccess
    ? auth.elevate(secrets.getSecretValue)
    : secrets.getSecretValue;
  const wixSecretResponse = await fromPromise(
    getSecretValue(secretName),
    (e) => (e instanceof Error ? e : new Error(String(e))),
  );

  if (wixSecretResponse.isErr()) {
    return err(
      new Error(
        `${PREFIX} failed to fetch secret "${secretName}" from Wix!\n${wixSecretResponse.error.message}`,
      ),
    );
  }

  const { value } = wixSecretResponse.value;

  if (!value) {
    return err(
      new Error(
        `${PREFIX} secret "${secretName}" returned an empty value from Wix!`,
      ),
    );
  }

  if (writeCache) {
    secretsCache.set(secretName, value);
  }

  if (parseJSON) {
    return returnWithParse<T>(value, secretName);
  }

  return ok(value);
}

export default { getSecretValue };
