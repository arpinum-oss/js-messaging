'use strict';

const { createMessageBus } = require('../build');

const bus = createMessageBus();
const unregister = bus.register('PrintText', message =>
  console.log(message.payload)
);
setTimeout(unregister, 5000);
const timer = setInterval(
  () => bus.post({ type: 'PrintText', payload: 'Hello world' }),
  1000
);
setTimeout(() => clearInterval(timer), 7000);
