<a href="https://studio.exweiv.com">
    <img align="right" alt="ExWeiv Studio Logo" title="ExWeiv Studio" height="60" src="https://raw.githubusercontent.com/ExWeiv/public/main/exweiv-studio/images/icon.png">
</a>

# Wix Secret Helpers

![NPM Downloads](https://img.shields.io/npm/dw/%40exweiv%2Fwix-secret-helpers)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/ExWeiv/wix-secret-helpers/publish.yml?label=CD)

This library provides a convenient helper for securely retrieving secrets from Wix Secrets Manager, with built-in memory caching and optional JSON parsing.

> Note: this library uses @wix/essentials SDK to grant access to secrets for any client. This is usually fine but in some cases you may not want it, in these cases disable `elevateAccess` in options.

## Usage

### Basic Example: Retrieve a Secret as a String

```js
import { getSecretValue } from '@exweiv/wix-secret-helpers';

// Returns `string`
const weatherAPIKey = await getSecretValue({ secretName: "WeatherAPIKey" }); 
const client = new WeatherClient(weatherAPIKey);
```

### Advanced Example: Retrieve and Parse a JSON Secret

```js
import { getSecretValue } from '@exweiv/wix-secret-helpers';

// Returns defined `object`
const twitterAPIConfig = /** @type {{appKey: string, appSecret: string, accessToken: string, accessSecret: string}} */ (await getSecretValue({ secretName: "TwitterJSON", parseJSON: true }));
const client = new TwitterAPI(twitterAPIConfig);
```

**Features:**
- Memory caching (enabled by default, can be disabled)
- Optional JSON parsing for secrets stored as JSON

---

[Kolay Gelsin](https://medium.com/the-optimists-daily/kolay-gelsin-a-turkish-expression-we-should-all-know-and-use-83fc1207ae5d) 💜