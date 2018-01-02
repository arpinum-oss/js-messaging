'use strict';

const { createMessageBus } = require('../build');

const bus = createMessageBus();
bus.register('PrintText', message => console.log('1', message.payload));
bus.register('PrintText', message => console.log('2', message.payload));
bus.register('Print', message => console.log('3', message.payload));
console.log(bus.handlerCount('PrintText')); // 2
console.log(bus.handlerCount('Print')); // 1
console.log(bus.handlerCount('Missing')); // 0
