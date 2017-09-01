'use strict';

function createQuickBus() {
  const handlerMap = new Map();

  return {
    post,
    register
  };

  function post(message) {
    try {
      validateArgs();
    } catch (e) {
      return Promise.reject(e);
    }
    const handlers = handlerMap.get(message.type) || [];
    return Promise.all(handlers.map(h => h(message)));

    function validateArgs() {
      if (!message) {
        throw new Error('Missing message');
      }
      if (!message.type) {
        throw new Error('Missing message type');
      }
    }
  }

  function register(type, handler) {
    validateArgs();
    const handlers = (handlerMap.get(type) || []).concat(handler);
    handlerMap.set(type, handlers);

    function validateArgs() {
      if (!type) {
        throw new Error('Missing type');
      }
      if (!handler) {
        throw new Error('Missing handler');
      }
      if (handler.constructor.name !== 'Function') {
        throw new Error('Handler must be a function');
      }
    }
  }
}

module.exports = createQuickBus;
