"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecretValue = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const wix_secrets_backend_v2_1 = require("wix-secrets-backend.v2");
const wixAuth = __importStar(require("wix-auth"));
const errors_1 = __importDefault(require("./errors"));
const secretsCache = new node_cache_1.default({ stdTTL: 360, deleteOnExpire: true, checkperiod: 30, useClones: false });
const getSecretValue = async (secretName, disableCache) => {
    try {
        if (!secretName) {
            throw Error(`${errors_1.default.prefix} secretName must be a valid string value!`);
        }
        if (disableCache === true) {
            return await getSecret(secretName);
        }
        const cachedSecret = secretsCache.get(secretName);
        if (cachedSecret) {
            return cachedSecret;
        }
        else {
            const secretValue = await getSecret(secretName);
            secretsCache.set(secretName, secretValue);
            return secretValue;
        }
    }
    catch (err) {
        throw Error(`${errors_1.default.prefix} ${err}`);
    }
};
exports.getSecretValue = getSecretValue;
const getSecret = async (secretName) => {
    try {
        const elevatedGetSecretValue = wixAuth.elevate(wix_secrets_backend_v2_1.secrets.getSecretValue);
        const { value } = await elevatedGetSecretValue(secretName);
        if (!value) {
            throw Error(`${errors_1.default.prefix} secret value is undefined! Response from Wix: ${value}`);
        }
        secretsCache.set(secretName, value);
        return value;
    }
    catch (err) {
        throw Error(`${errors_1.default.prefix} unable to get the secret value from Wix APIs using wix-secrets-backend.v2`);
    }
};
exports.default = exports.getSecretValue;
