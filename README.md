# @arpinum/messaging [![Build Status](https://travis-ci.org/arpinum/js-messaging.svg?branch=master)](https://travis-ci.org/arpinum/js-messaging)

> Life is a little like a message in a bottle, to be carried by the winds and the tides.
> <cite>Gene Tierney</cite>

*@arpinum/messaging* contains a simple message bus.

## Installation

```bash
npm install @arpinum/messaging --save
```

## Example

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();

bus.register('PrintText', message => console.log(message.payload.text));

bus.post({type: 'PrintText', payload: {text: 'Hello world'}});

// Hello world
```

## License

[MIT](LICENSE)
