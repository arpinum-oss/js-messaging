'use strict';

const t = require('tcomb');
const {map: mapToPromises, wrap, compose} = require('@arpinum/promising');
const Message = require('./message');

const Creation = t.maybe(t.interface({
  log: t.maybe(t.Function),
  exclusiveHandlers: t.maybe(t.Boolean),
  ensureAtLeastOneHandler: t.maybe(t.Boolean),
  handlersConcurrency: t.maybe(t.Integer),
  beforeHandle: t.maybe(t.list(t.Function)),
  afterHandle: t.maybe(t.list(t.Function))
}, {strict: true}));

class MessageBus {

  constructor(creation = {}) {
    const {
      log,
      exclusiveHandlers,
      ensureAtLeastOneHandler,
      handlersConcurrency,
      beforeHandle,
      afterHandle
    } = Creation(creation);
    this._log = log || console.log;
    this._exclusiveHandlers = exclusiveHandlers || false;
    this._ensureAtLeastOneHandler = ensureAtLeastOneHandler || false;
    this._handlersConcurrency = handlersConcurrency || 3;
    this._beforeHandle = beforeHandle || [];
    this._afterHandle = afterHandle || [];
    this._handlerMap = new Map();
  }

  postAll(messages) {
    return mapToPromises(messages, message => this.post(message));
  }

  post(messageOrRaw) {
    const self = this;
    const message = new Message(messageOrRaw);
    this._log('Posting', message.type);
    const handlers = this._handlersFor(message.type);

    return wrap(() => {
      checkHandlerRequirements();
      if (this._exclusiveHandlers) {
        return postForExclusiveHandlers();
      }
      return postForStandardHandlers();
    })();

    function checkHandlerRequirements() {
      if (handlers.length === 0 && self._ensureAtLeastOneHandler) {
        throw new Error(`No handler for ${message.type}`);
      }
    }

    function postForExclusiveHandlers() {
      if (handlers.length === 0) {
        return Promise.resolve();
      }
      return handle(handlers[0]);
    }

    function postForStandardHandlers() {
      if (handlers.length === 0) {
        return Promise.resolve([]);
      }
      return mapToPromises(handlers, handle, {concurrency: self._handlersConcurrency});
    }

    function handle(handler) {
      const promiseSafeHandler = wrap(message => handler(message.clone()));
      return compose(self._beforeHandle)(message)
        .then(promiseSafeHandler)
        .then(compose(self._afterHandle));
    }
  }

  register(messageType, handler) {
    const self = this;
    this._log('Registering to', messageType);
    const handlers = this._handlersFor(messageType);
    if (this._exclusiveHandlers && handlers.length > 0) {
      throw new Error(`Won't allow a new handler for type ${messageType} since handlers are exclusive`);
    }
    this._updateHandlers(messageType, handlers.concat(handler));

    return unregister;

    function unregister() {
      self._updateHandlers(messageType, self._handlersFor(messageType).filter(h => h !== handler));
    }
  }

  unregisterAll(...messageTypes) {
    messageTypes.forEach(messageType => this._updateHandlers(messageType, []));
  }

  handlerCount(messageType) {
    return this._handlersFor(messageType).length;
  }

  _handlersFor(messageType) {
    return this._handlerMap.get(messageType) || [];
  }

  _updateHandlers(messageType, handlers) {
    this._handlerMap.set(messageType, handlers);
  }
}

module.exports = MessageBus;
