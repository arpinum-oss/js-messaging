# @arpinum/messaging [![Build Status](https://github.com/arpinum-oss/js-messaging/workflows/CI/badge.svg)](https://github.com/arpinum-oss/js-messaging/actions?query=workflow%3ACI)

> Life is a little like a message in a bottle, to be carried by the winds and the tides.  
> <cite>Gene Tierney</cite>

_@arpinum/messaging_ contains a simple message bus.

## Installation

```
npm install @arpinum/messaging --save
```

## Example

```ts
import { createMessageBus } from "@arpinum/messaging";

const bus = createMessageBus();
bus.register("PrintText", (message) => console.log(message.payload));
bus.post({ type: "PrintText", payload: "Hello world" }).catch(console.error);
```

## Docs

- [API](docs/api.md)

## License

[MIT](LICENSE)
