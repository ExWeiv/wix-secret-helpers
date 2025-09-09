# Secret Helpers for Wix Secrets Manager APIs

This library provides a convenient helper for securely retrieving secrets from Wix Secrets Manager, with built-in memory caching and optional JSON parsing.

## Usage

### Basic Example: Retrieve a Secret as a String

```js
import { getSecretValue } from '@exweiv/wix-secret-helpers';

// Returns `string`
const weatherAPIKey = await getSecretValue("WeatherAPIKey"); 
const client = new WeatherClient(weatherAPIKey);
```

### Advanced Example: Retrieve and Parse a JSON Secret

```js
import { getSecretValue } from '@exweiv/wix-secret-helpers';

// Returns defined `object`
const twitterAPIConfig = /** @type {{appKey: string, appSecret: string, accessToken: string, accessSecret: string}} */ (await getSecretValue("TwitterJSON", true));
const client = new TwitterAPI(twitterAPIConfig);
```

**Features:**
- Memory caching (enabled by default, but can be disabled)
- Optional JSON parsing for secrets stored as JSON

---

[Kolay Gelsin](https://medium.com/the-optimists-daily/kolay-gelsin-a-turkish-expression-we-should-all-know-and-use-83fc1207ae5d) 💜

<img src="https://static.wixstatic.com/media/510eca_399a582544de4cb2b958ce934578097f~mv2.png">