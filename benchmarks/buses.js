'use strict';

const {MessageBus, QuickBus} = require('../lib');

const postCount = 100000;

benchWith(new MessageBus({log: () => undefined}))
  .then(() => benchWith(new QuickBus()));

function benchWith(bus) {
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
    return bus.post({type: 'Handle'}).then(post);
  }

  function printStatistics() {
    const end = new Date();
    const duration = end - start;
    console.log(`${handleCount} messages handled in ${duration} ms with ${bus.constructor.name}`);
  }
}

