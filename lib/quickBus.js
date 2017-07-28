'use strict';

class QuickBus {

  constructor() {
    this._handlerMap = new Map();
  }

  post(message) {
    try {
      validateArgs();
    } catch (e) {
      return Promise.reject(e);
    }
    let handlers = this._handlerMap.get(message.type) || [];
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

  register(type, handler) {
    validateArgs();
    let handlers = (this._handlerMap.get(type) || []).concat(handler);
    this._handlerMap.set(type, handlers);

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

module.exports = QuickBus;
