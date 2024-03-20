# Secret Helpers for Wix Secrets Manager APIs

This simple library contains (currently only one) helper functions/APIs for `wix-secret-backend.v2` APIs. Examples here:

**getSecretValue** API is making it possible to get secrets as string and cache them by default so you next calls will be faster.

```js
import { getSecretValue } from '@exweiv/wix-secret-helpers';

// get secret value with cache enabled:
const secret = await getSecretValue("secretName");

// disable cache
const secretNoCache = await getSecretValue("secretName", true);

// handle secret value
```

---

[Kolay Gelsin](https://medium.com/the-optimists-daily/kolay-gelsin-a-turkish-expression-we-should-all-know-and-use-83fc1207ae5d) 💜

<img src="https://static.wixstatic.com/media/510eca_399a582544de4cb2b958ce934578097f~mv2.png">