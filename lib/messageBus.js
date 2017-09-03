'use strict';

const {mapWithOptions: mapToPromises, wrap, compose} = require('@arpinum/promising');

function createMessageBus(creation = {}) {
  validateArgs();

  const {
    log = console.log,
    exclusiveHandlers = false,
    ensureAtLeastOneHandler = false,
    handlersConcurrency = 3,
    beforeHandle = [],
    afterHandle = []
  } = creation;

  const handlerMap = new Map();

  return {
    postAll,
    post,
    register,
    unregisterAll,
    handlerCount
  };

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

  function postAll(messages) {
    return mapToPromises(message => post(message), {concurrency: 3}, messages);
  }

  function post(message) {
    return wrap(() => {
      validateArgs();
      log('Posting', message.type);
      const handlers = handlersFor(message.type);
      checkHandlerRequirements(handlers);
      if (exclusiveHandlers) {
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
      if (handlers.length === 0 && ensureAtLeastOneHandler) {
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
      return mapToPromises(handle, {concurrency: handlersConcurrency}, handlers);
    }

    function handle(handler) {
      const promiseSafeHandler = wrap(message => handler(message));
      return compose(beforeHandle)(message)
        .then(promiseSafeHandler)
        .then(compose(afterHandle));
    }
  }

  function register(type, handler) {
    validateArgs();
    log('Registering to', type);
    const handlers = handlersFor(type);
    if (exclusiveHandlers && handlers.length > 0) {
      throw new Error(`Won't allow a new handler for type ${type} since handlers are exclusive`);
    }
    updateHandlers(type, handlers.concat(handler));

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
      updateHandlers(type, handlersFor(type).filter(h => h !== handler));
    }
  }

  function unregisterAll(...types) {
    validateArgs();
    types.forEach(type => updateHandlers(type, []));

    function validateArgs() {
      types.forEach(type => {
        if (notA(type, 'string')) {
          throw new Error('types must be strings');
        }
      });
    }
  }

  function handlerCount(type) {
    validateArgs();
    return handlersFor(type).length;

    function validateArgs() {
      if (notA(type, 'string')) {
        throw new Error('type must be a string');
      }
    }
  }

  function handlersFor(messageType) {
    return handlerMap.get(messageType) || [];
  }

  function updateHandlers(messageType, handlers) {
    handlerMap.set(messageType, handlers);
  }
}

function notA(value, type) {
  return value === null || typeof value !== type;
}

module.exports = createMessageBus;
