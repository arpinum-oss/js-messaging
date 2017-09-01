'use strict';

const {mapWithOptions: mapToPromises, wrap, compose} = require('@arpinum/promising');

class MessageBus {

  constructor(creation = {}) {
    validateArgs();
    const {
      log,
      exclusiveHandlers,
      ensureAtLeastOneHandler,
      handlersConcurrency,
      beforeHandle,
      afterHandle
    } = creation;
    this._log = log || console.log;
    this._exclusiveHandlers = exclusiveHandlers || false;
    this._ensureAtLeastOneHandler = ensureAtLeastOneHandler || false;
    this._handlersConcurrency = handlersConcurrency || 3;
    this._beforeHandle = beforeHandle || [];
    this._afterHandle = afterHandle || [];
    this._handlerMap = new Map();

    function validateArgs() {
      if (creation.log !== undefined && notA(creation.log, 'function')) {
        throw new Error('log must be a function');
      }
      if (creation.exclusiveHandlers !== undefined && notA(creation.exclusiveHandlers, 'boolean')) {
        throw new Error('exclusiveHandlers must be a boolean');
      }
      if (creation.ensureAtLeastOneHandler !== undefined && notA(creation.ensureAtLeastOneHandler, 'boolean')) {
        throw new Error('ensureAtLeastOneHandler must be a boolean');
      }
      if (creation.handlersConcurrency !== undefined && notA(creation.handlersConcurrency, 'number')) {
        throw new Error('handlersConcurrency must be a number');
      }
      if (creation.beforeHandle !== undefined && !Array.isArray(creation.beforeHandle)) {
        throw new Error('beforeHandle must be an array');
      }
      if (creation.afterHandle !== undefined && !Array.isArray(creation.afterHandle)) {
        throw new Error('afterHandle must be an array');
      }
    }
  }

  postAll(messages) {
    return mapToPromises(message => this.post(message), {concurrency: 3}, messages);
  }

  post(message) {
    const self = this;
    return wrap(() => {
      validateArgs();
      this._log('Posting', message.type);
      const handlers = this._handlersFor(message.type);
      checkHandlerRequirements(handlers);
      if (this._exclusiveHandlers) {
        return postForExclusiveHandlers(handlers);
      }
      return postForStandardHandlers(handlers);
    })();

    function validateArgs() {
      if (!message) {
        throw new Error('Missing message');
      }
      if (!message.type) {
        throw new Error('Missing message type');
      }
    }

    function checkHandlerRequirements(handlers) {
      if (handlers.length === 0 && self._ensureAtLeastOneHandler) {
        throw new Error(`No handler for ${message.type}`);
      }
    }

    function postForExclusiveHandlers(handlers) {
      if (handlers.length === 0) {
        return Promise.resolve();
      }
      return handle(handlers[0]);
    }

    function postForStandardHandlers(handlers) {
      if (handlers.length === 0) {
        return Promise.resolve([]);
      }
      return mapToPromises(handle, {concurrency: self._handlersConcurrency}, handlers);
    }

    function handle(handler) {
      const promiseSafeHandler = wrap(message => handler(cloneMessage(message)));
      return compose(self._beforeHandle)(message)
        .then(promiseSafeHandler)
        .then(compose(self._afterHandle));
    }

    function cloneMessage(message) {
      const payload = Object.assign({}, message.payload);
      return Object.assign({}, message, {payload});
    }
  }

  register(type, handler) {
    const self = this;
    validateArgs();
    this._log('Registering to', type);
    const handlers = this._handlersFor(type);
    if (this._exclusiveHandlers && handlers.length > 0) {
      throw new Error(`Won't allow a new handler for type ${type} since handlers are exclusive`);
    }
    this._updateHandlers(type, handlers.concat(handler));

    return unregister;

    function validateArgs() {
      if (!type) {
        throw new Error('Missing type');
      }
      if (!handler) {
        throw new Error('Missing handler');
      }
      if (notA(handler, 'function')) {
        throw new Error('handler must be a function');
      }
    }

    function unregister() {
      self._updateHandlers(type, self._handlersFor(type).filter(h => h !== handler));
    }
  }

  unregisterAll(...types) {
    validateArgs();
    types.forEach(type => this._updateHandlers(type, []));

    function validateArgs() {
      types.forEach(type => {
        if (notA(type, 'string')) {
          throw new Error('types must be strings');
        }
      });
    }
  }

  handlerCount(type) {
    validateArgs();
    return this._handlersFor(type).length;

    function validateArgs() {
      if (notA(type, 'string')) {
        throw new Error('type must be a string');
      }
    }
  }

  _handlersFor(messageType) {
    return this._handlerMap.get(messageType) || [];
  }

  _updateHandlers(messageType, handlers) {
    this._handlerMap.set(messageType, handlers);
  }
}

function notA(value, type) {
  return value === null || typeof value !== type;
}

module.exports = MessageBus;
