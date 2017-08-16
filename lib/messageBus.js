'use strict';

const t = require('tcomb');
const {map: mapToPromises, wrap, compose} = require('@arpinum/promising');
const Message = require('./message');

const Creation = t.maybe(t.interface({
  log: t.maybe(t.Function),
  exclusiveHandlers: t.maybe(t.Boolean),
  handlersConcurrency: t.maybe(t.Integer),
  beforeHandle: t.maybe(t.list(t.Function)),
  afterHandle: t.maybe(t.list(t.Function))
}, {strict: true}));

class MessageBus {

  constructor(creation = {}) {
    const {
      log,
      exclusiveHandlers,
      handlersConcurrency,
      beforeHandle,
      afterHandle
    } = Creation(creation);
    this._log = log || console.log;
    this._exclusiveHandlers = exclusiveHandlers || false;
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
    const handlers = this._handlerMap.get(message.type) || [];
    if (handlers.length === 0) {
      return Promise.resolve();
    }
    if (this._exclusiveHandlers) {
      return handle(handlers[0]);
    }
    return mapToPromises(handlers, handle, {concurrency: this._handlersConcurrency});

    function handle(handler) {
      const promiseSafeHandler = message => wrap(() => handler(message.clone()));
      return compose(self._beforeHandle)(message)
        .then(promiseSafeHandler)
        .then(compose(self._afterHandle));
    }
  }

  register(messageType, handler) {
    this._log('Registering to', messageType);
    if (!this._handlerMap.has(messageType)) {
      this._handlerMap.set(messageType, []);
    }
    const handlers = this._handlerMap.get(messageType);
    if (this._exclusiveHandlers && handlers.length > 0) {
      throw new Error(`Won't allow a new handler for type ${messageType} since handlers are exclusive`);
    }
    handlers.push(handler);

    return unregister;

    function unregister() {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  handlerCount(messageType) {
    return (this._handlerMap.get(messageType) || []).length;
  }
}

module.exports = MessageBus;
