'use strict';

const t = require('tcomb');
const {Logger, LoggerContract} = require('@arpinum/log');
const {map: mapToPromises, try: asyncTry, flow} = require('@arpinum/promise');
const Message = require('./message');

const Creation = t.maybe(t.interface({
  log: t.maybe(LoggerContract),
  exclusiveHandlers: t.maybe(t.Boolean),
  handlersConcurrency: t.maybe(t.Integer),
  beforeHandle: t.maybe(t.list(t.Function)),
  afterHandle: t.maybe(t.list(t.Function))
}, {strict: true}));

class MessageBus {

  constructor(creation = {}) {
    let {
      log,
      exclusiveHandlers,
      handlersConcurrency,
      beforeHandle,
      afterHandle
    } = Creation(creation);
    this._log = log || new Logger({fileName: __filename});
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
    let self = this;
    let message = new Message(messageOrRaw);
    this._log.debug('Posting', message.type);
    let handlers = this._handlerMap.get(message.type) || [];
    if (handlers.length === 0) {
      return Promise.resolve();
    }
    if (this._exclusiveHandlers) {
      return handle(handlers[0]);
    }
    return mapToPromises(handlers, handle, {concurrency: this._handlersConcurrency});

    function handle(handler) {
      let promiseSafeHandler = message => asyncTry(() => handler(message.clone()));
      return flow(self._beforeHandle)(message)
        .then(promiseSafeHandler)
        .then(flow(self._afterHandle));
    }
  }

  register(messageType, handler) {
    this._log.debug('Registering to', messageType);
    if (!this._handlerMap.has(messageType)) {
      this._handlerMap.set(messageType, []);
    }
    let handlers = this._handlerMap.get(messageType);
    if (this._exclusiveHandlers && handlers.length > 0) {
      throw new Error(`Won't allow a new handler for type ${messageType} since handlers are exclusive`);
    }
    handlers.push(handler);
  }
}

module.exports = MessageBus;
