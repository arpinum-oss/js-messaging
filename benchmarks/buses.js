'use strict';

const { createMessageBus } = require('../lib');
const createQuickBus = require('../lib/quickBus');

const postCount = 100000;

benchWith(createMessageBus({ log: () => undefined }), 'Message bus').then(() =>
  benchWith(createQuickBus(), 'Quick bus')
);

// 100000 messages handled in 1100 ms with Message bus
// 100000 messages handled in 254 ms with Quick bus

function benchWith(bus, name) {
  let handleCount = 0;
  const start = new Date();

  bus.register('Handle', () => {
    handleCount++;
  });

  return post()
    .then(printStatistics)
    .catch(console.error);

  function post() {
    if (handleCount >= postCount) {
      return Promise.resolve();
    }
    return bus.post({ type: 'Handle' }).then(post);
  }

  function printStatistics() {
    const end = new Date();
    const duration = end - start;
    const message = `${handleCount} messages handled in ${duration} ms with ${
      name
    }`;
    console.log(message);
  }
}
