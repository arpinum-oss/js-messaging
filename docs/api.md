# createMessageBus(options)

- `options?: Object`
  - `log?: function` - Function to call when bus needs to print some logs. Does nothing by default.
  - `exclusiveHandlers?: boolean` - Allows only one handler per message. Defaults to false.
  - `ensureAtLeastOneHandler?: boolean` - Throws error if a posted message is not handled. Defaults to false.
  - `handlersConcurrency?: number` - Limits handler execution in parallel. Defaults to 3.
  - `beforePost?: function[]` - Execute functions before posting a message in order to apply some transformations to
    the message.
  - `afterPost?: function[]` - Execute functions after posting (and fully handling) a message in order to apply some
    transformations to the results.
  - `beforeHandle?: function[]` - Execute functions before handling a message in order to apply some transformations
    to the message.
  - `afterHandle?: function[]` - Execute functions after handling a message in order to apply some transformations to
    the result.
- returns: `MessageBus`

Creates a [MessageBus] object that posts messages to registered handlers.

Examples:

- [bus creation](../examples/basic.ts)
- [before handle](../examples/beforeHandle.ts)
- [after handle](../examples/afterHandle.ts)

# Message interface

A message must have the following properties:

- `type: string`
- `payload?: any`

A message may represent an event (UserSignedUp, ProfileCreated), a command (SignUserUp, CreateProfile) or a query (
FindUsers, FindProfileById), following [CQRS] semantic.

The payload can be anything like a string, integer or object. A self-describing object like `{userId: 'some-uuid'}`
might be more useful than just `'some-uuid'` though.

A message should be a plain JavaScript object, preferably immutable.

# MessageBus class

## bus.post(message)

- `message: Message` - [Message] to post.
- returns: `Promise<any>` - Contains an array with all handlers results.

Posts a message to registered handlers.

Example:

```ts
import { createMessageBus } from "@arpinum/messaging";

const bus = createMessageBus();
bus.post({ type: "PrintText", payload: "Hello world" });
```

## bus.postAll(messages)

- `message: Message[]` - [Message] objects to post.
- returns: `Promise<any[]>` - Contains an array with all post results. See `bus.post` method.

Posts multiple messages to respective registered handlers.

Example:

```ts
import { createMessageBus } from "@arpinum/messaging";

const bus = createMessageBus();
const messages = [
  { type: "PrintText", payload: "Hello..." },
  { type: "PrintText", payload: "...world" },
];
bus.postAll(messages);
```

## register(type, handler)

- `type: string` - Message type to register.
- `handler: function` - Function to handle message of provided type. May return a promise if asynchronous.
- returns: `void`

Registers a handler for the provided message type.

Example:

```ts
import { createMessageBus } from "@arpinum/messaging";

const bus = createMessageBus();
bus.register("PrintText", (message) => console.log(message.payload));
```

## unregisterAll(...types)

- `types: string` - Message types to unregister.
- returns: `void`

Unregister all handlers for given message types.

Example:

```ts
import { createMessageBus } from "@arpinum/messaging";

const bus = createMessageBus();
bus.register("PrintText", (message) => console.log(message.payload));
bus.unregisterAll("PrintText");
bus.post({ type: "PrintText", payload: "Hello world" });

// nothing happens
```

## handlerCount(type)

- `type: string` - Message type to count handler for.
- returns: `number`

Returns the number of handlers for the given message type.

Example:

```ts
import { createMessageBus } from "@arpinum/messaging";

const bus = createMessageBus();
bus.register("PrintText", (message) => console.log("1", message.payload));
bus.register("PrintText", (message) => console.log("2", message.payload));
bus.register("Print", (message) => console.log("3", message.payload));
console.log(bus.handlerCount("PrintText")); // 2
console.log(bus.handlerCount("Print")); // 1
console.log(bus.handlerCount("Missing")); // 0
```

[messagebus]: #messagebus-object
[message]: #message-interface
[cqrs]: https://martinfowler.com/bliki/CQRS.html
