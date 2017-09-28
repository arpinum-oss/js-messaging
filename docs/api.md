# createMessageBus(options)

* `options` `Object`
  * `log` `function` Function to call when bus needs to print some logs. Defaults to `console.log`.
  * `exclusiveHandlers` `boolean` Allows only one handler per message. Defaults to false.
  * `ensureAtLeastOneHandler` `boolean` Throws error if a posted message is not handled. Defaults to false.
  * `handlersConcurrency` `number` Limits handler execution in parallel. Defaults to 3.
  * `beforeHandle` `Array<function>` Execute functions before handling a message in order to apply some transformations to the message.
  * `afterHandle` `Array<function>` Execute functions after handling a message in order to apply some transformations to the result.
* returns: `MessageBus`

Creates a [MessageBus] object that posts messages to registered handlers.

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

# Message contract

A message must have the following properties:

* `type` `string` 
* `payload` `any`

A message may represent an event (UserSignedUp, ProfileCreated), a command (SignUserUp, CreateProfile) or a query (FindUsers, FindProfileById), following [CQRS] semantic.

The payload can be anything like a string, integer or object. A self-describing object like `{userId: 'some-uuid'}` might be more useful than just `'some-uuid'` though.

A message should be a plain JavaScript object, preferably immutable.

# MessageBus object

## bus.post(message)

* `message` `object` Message to post. Must match [message contract].
* returns: `Promise` Contains an array with all handlers results or a single result if handlers are exclusive.

Posts a message to registered handlers.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
bus.post({type: 'PrintText', payload: 'Hello world'});
```

## bus.postAll(messages)

* `message` `Array<object>` Messages to post. They all must match [message contract].
* returns: `Promise` Contains an array with all post results. See `bus.post` method.

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

* `type` `string` Message type to register
* `handler` `function` Function to handle message of provided type. May return a promise if asynchronous.
* returns: `void`

Registers a handler for the provided message type.

Example:

```javascript
const {createMessageBus} = require('@arpinum/messaging');

const bus = createMessageBus();
bus.register('PrintText', message => console.log(message.payload));
```

## unregisterAll(...types)

* `...types` `string` Message types to unregister
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

* `type` `string` Message type to count handler for
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

# tcomb types

If you use [tcomb] you can use the following interfaces:

* `MessageBusContract` Interface for message bus defining public methods documented here
* `MessageContract` Interface for message matching [message-contract]

@arpinum/messaging does not depend on tcomb so you must provide it to get those types.

Example:

```javascript
const t = require('tcomb');
const {contracts} = require('@arpinum/messaging');

const {MessageContract} = contracts(t);

const message = MessageContract({type: 'UserSignedUp', payload: {login: 'john'}});
```


[MessageBus]: #message-bus-object
[message contract]: #message-contract
[CQRS]: https://martinfowler.com/bliki/CQRS.html
[tcomb]: https://github.com/gcanti/tcomb
