'use strict';

const { createMessageBus } = require('../lib');

const bus = createMessageBus();
bus.register('PrintText', message => console.log('1', message.payload));
bus.register('PrintText', message => console.log('2', message.payload));
setTimeout(() => bus.unregisterAll('PrintText'), 5000);
const timer = setInterval(
  () => bus.post({ type: 'PrintText', payload: 'Hello world' }),
  1000
);
setTimeout(() => clearInterval(timer), 7000);
