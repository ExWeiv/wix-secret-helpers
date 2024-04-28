/// <reference path="../types/global.d.ts" />

// API Imports
import NodeCache from 'node-cache'; //@ts-ignore
import { secrets } from 'wix-secrets-backend.v2'; //@ts-ignore
import * as wixAuth from 'wix-auth';
// Internal Imports
import errCodes from './errors';

const secretsCache = new NodeCache({ stdTTL: 360, deleteOnExpire: true, checkperiod: 30, useClones: false });

export const getSecretValue = async (secretName: string, disableCache?: boolean): Promise<string> => {
    try {
        if (!secretName) {
            throw Error(`${errCodes.prefix} secretName must be a valid string value!`);
        }

        if (disableCache === true) {
            return await getSecret(secretName);
        }

        const cachedSecret = secretsCache.get<string>(secretName);

        if (cachedSecret) {
            return cachedSecret;
        } else {
            const secretValue = await getSecret(secretName);
            secretsCache.set<string>(secretName, secretValue);
            return secretValue;
        }
    } catch (err) {
        throw Error(`${errCodes.prefix} ${err}`);
    }
}

const getSecret = async (secretName: string): Promise<string> => {
    try {
        const elevatedGetSecretValue = wixAuth.elevate(secrets.getSecretValue);
        const { value }: { value: string | undefined } = await elevatedGetSecretValue(secretName);

        if (!value) {
            throw Error(`${errCodes.prefix} secret value is undefined! Response from Wix: ${value}`);
        }

        secretsCache.set<string>(secretName, value);
        return value;
    } catch (err) {
        throw Error(`${errCodes.prefix} unable to get the secret value from Wix APIs using wix-secrets-backend.v2`);
    }
}

export default getSecretValue;