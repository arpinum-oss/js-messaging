# createMessageBus(options)

* `options` `Object`
  * `log` `function` Function to call when bus needs to print some logs. Defaults to `console.log`.
  * `exclusiveHandlers` `boolean` Allows only one handler per message. Defaults to false.
  * `ensureAtLeastOneHandler` `boolean` Throws error if a posted message is not handled. Defaults to false.
  * `handlersConcurrency` `number` Limits handler execution in parallel. Defaults to 3.
  * `beforeHandle` `Array<function>` Execute functions before handling a message in order to apply some transformations to the message.
  * `afterHandle` `Array<function>` Execute functions after handling a message in order to apply some transformations to the result.
* returns: `MessageBus`

Creates a [MessageBus](#message-bus) object that posts messages to registered handlers.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
bus.register('PrintText', message => console.log(message.payload));
bus.post({type: 'PrintText', payload: 'Hello world'});
```

Before handle example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const withUpperCaseText = m => Object.assign({}, m, {payload: m.payload.toUpperCase()});
const withoutSpaceInText = m => Object.assign({}, m, {payload: m.payload.replace(' ', '-')});

const bus = createMessageBus({
  beforeHandle: [
    withUpperCaseText,
    withoutSpaceInText
  ]
});
bus.register('PrintText', message => console.log(message.payload));
bus.post({type: 'PrintText', payload: 'Hello world'});

// HELLO-WORLD
```

After handle example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const upperCaseText = text => text.toUpperCase();
const withoutSpace = text => text.replace(' ', '-');

const bus = createMessageBus({
  afterHandle: [
    upperCaseText,
    withoutSpace
  ]
});
bus.register('ReturnText', message => message.payload);
bus.post({type: 'ReturnText', payload: 'Hello world'})
  .then(([text]) => console.log(text));
  
// HELLO-WORLD
```

# MessageBus object

## bus.post(message)

* `message` `object` Message to post. Must match [message contract#message-contract].
* returns: `Promise`

Posts a message to registered handlers.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
bus.post({type: 'PrintText', payload: 'Hello world'});
```

## bus.postAll(messages)

* `message` `Array<object>` Messages to post. They all must match [message contract#message-contract].
* returns: `Promise`

Posts multiple messages to respective registered handlers.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
const messages = [
  {type: 'PrintText', payload: 'Hello...'},
  {type: 'PrintText', payload: '...world'},
];
bus.postAll(messages);
```

## register(type, handler)

* `type` `string`
* `handler` `function`
* returns: `void`

Registers a handler for the provided message type.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
bus.register('PrintText', message => console.log(message.payload));
```

## unregisterAll(...types)

* `...types` `string`
* returns: `void`

Unregister all handlers for given message types.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
bus.register('PrintText', message => console.log(message.payload));
bus.unregisterAll('PrintText');
bus.post({type: 'PrintText', payload: 'Hello world'});

// nothing happens
```

## handlerCount(type)

* `type` `string`
* returns: `number`

Returns the number of handlers for the given message type.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
bus.register('PrintText', message => console.log('1', message.payload));
bus.register('PrintText', message => console.log('2', message.payload));
bus.register('Print', message => console.log('3', message.payload));
console.log(bus.handlerCount('PrintText')); // 2
console.log(bus.handlerCount('Print')); // 1
console.log(bus.handlerCount('Missing')); // 0
```

## Message contract
