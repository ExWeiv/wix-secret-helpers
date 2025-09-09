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
- Memory caching (enabled by default, but can be disabled)
- Optional JSON parsing for secrets stored as JSON

---

[Kolay Gelsin](https://medium.com/the-optimists-daily/kolay-gelsin-a-turkish-expression-we-should-all-know-and-use-83fc1207ae5d) 💜

<img src="https://static.wixstatic.com/media/510eca_399a582544de4cb2b958ce934578097f~mv2.png">