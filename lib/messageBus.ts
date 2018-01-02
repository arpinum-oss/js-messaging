import {
  compose,
  mapWithOptions as mapToPromises,
  wrap
} from '@arpinum/promising';

import { Message, MessageHandler } from './types';

export interface MessageBusOptions {
  log?: (...args: any[]) => void;
  exclusiveHandlers?: boolean;
  ensureAtLeastOneHandler?: boolean;
  handlersConcurrency?: number;
  beforePost?: any[];
  afterPost?: any[];
  beforeHandle?: any[];
  afterHandle?: any[];
}

const defaultOptions: MessageBusOptions = {
  log: () => undefined as any,
  exclusiveHandlers: false,
  ensureAtLeastOneHandler: false,
  handlersConcurrency: 3,
  beforePost: [],
  afterPost: [],
  beforeHandle: [],
  afterHandle: []
};

export class MessageBus {
  private options: MessageBusOptions;
  private handlerMap: Map<string, MessageHandler[]>;

  constructor(options: MessageBusOptions = {}) {
    this.validateOptions(options);
    this.options = Object.assign({}, defaultOptions, options);
    this.handlerMap = new Map();
  }

  private validateOptions(options: MessageBusOptions) {
    if (options.log !== undefined && notA(options.log, 'function')) {
      throw new Error('log must be a function');
    }
    if (
      options.exclusiveHandlers !== undefined &&
      notA(options.exclusiveHandlers, 'boolean')
    ) {
      throw new Error('exclusiveHandlers must be a boolean');
    }
    if (
      options.ensureAtLeastOneHandler !== undefined &&
      notA(options.ensureAtLeastOneHandler, 'boolean')
    ) {
      throw new Error('ensureAtLeastOneHandler must be a boolean');
    }
    if (
      options.handlersConcurrency !== undefined &&
      notA(options.handlersConcurrency, 'number')
    ) {
      throw new Error('handlersConcurrency must be a number');
    }
    if (
      options.beforePost !== undefined &&
      !Array.isArray(options.beforePost)
    ) {
      throw new Error('beforePost must be an array');
    }
    if (
      options.beforeHandle !== undefined &&
      !Array.isArray(options.beforeHandle)
    ) {
      throw new Error('beforeHandle must be an array');
    }
    if (
      options.afterHandle !== undefined &&
      !Array.isArray(options.afterHandle)
    ) {
      throw new Error('afterHandle must be an array');
    }
  }

  public postAll(messages: Message[]) {
    return mapToPromises(
      message => this.post(message),
      { concurrency: 3 },
      messages
    );
  }

  public post(message: Message) {
    const self = this;
    return wrap(validateMessage as any)(message)
      .then(() => message)
      .then(compose(this.options.beforePost))
      .then(postToHandlers)
      .then(compose(this.options.afterPost));

    function postToHandlers(messageToPost: Message) {
      self.options.log(`Posting ${messageToPost.type}`);
      const handlers = self.handlersFor(messageToPost.type);
      checkHandlerRequirements(messageToPost, handlers);
      if (self.options.exclusiveHandlers) {
        return postForExclusiveHandlers(messageToPost, handlers);
      }
      return postForStandardHandlers(messageToPost, handlers);
    }

    function validateMessage(messageToValidate: Message) {
      if (!messageToValidate) {
        throw new Error('Missing message');
      }
      if (!messageToValidate.type) {
        throw new Error('Missing message type');
      }
    }

    function checkHandlerRequirements(
      messageToCheck: Message,
      handlers: MessageHandler[]
    ) {
      if (handlers.length === 0 && self.options.ensureAtLeastOneHandler) {
        throw new Error(`No handler for ${messageToCheck.type}`);
      }
    }

    function postForExclusiveHandlers(
      messageToPost: Message,
      handlers: MessageHandler[]
    ) {
      if (handlers.length === 0) {
        return Promise.resolve();
      }
      return self.handle(messageToPost, handlers[0]);
    }

    function postForStandardHandlers(
      messageToPost: Message,
      handlers: MessageHandler[]
    ) {
      if (handlers.length === 0) {
        return Promise.resolve([]);
      }
      const handleMessage = (handler: MessageHandler) =>
        self.handle(messageToPost, handler);
      return mapToPromises(
        handleMessage,
        { concurrency: self.options.handlersConcurrency },
        handlers
      );
    }
  }

  private handle(message: Message, handler: MessageHandler) {
    return compose(this.options.beforeHandle)(message)
      .then(wrap(handler))
      .then(compose(this.options.afterHandle));
  }

  public register(type: string, handler: MessageHandler) {
    const self = this;
    validateArgs();
    this.options.log(`Registering to ${type}`);
    const handlers = this.handlersFor(type);
    ensureHandlerExclusivity();
    this.updateHandlers(type, handlers.concat(handler));

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

    function ensureHandlerExclusivity() {
      if (self.options.exclusiveHandlers && handlers.length > 0) {
        const message =
          `Won't allow a new handler for type ${type} ` +
          `since handlers are exclusive`;
        throw new Error(message);
      }
    }

    function unregister() {
      self.updateHandlers(
        type,
        self.handlersFor(type).filter(h => h !== handler)
      );
    }
  }

  public unregisterAll(...types: string[]) {
    validateArgs();
    types.forEach(type => this.updateHandlers(type, []));

    function validateArgs() {
      types.forEach(type => {
        if (notA(type, 'string')) {
          throw new Error('types must be strings');
        }
      });
    }
  }

  public handlerCount(type: string) {
    validateArgs();
    return this.handlersFor(type).length;

    function validateArgs() {
      if (notA(type, 'string')) {
        throw new Error('type must be a string');
      }
    }
  }

  private handlersFor(messageType: string) {
    return this.handlerMap.get(messageType) || [];
  }

  private updateHandlers(messageType: string, handlers: MessageHandler[]) {
    this.handlerMap.set(messageType, handlers);
  }
}

export function createMessageBus(options: MessageBusOptions = {}): MessageBus {
  return new MessageBus(options);
}

function notA(value: any, type: string) {
  return value === null || typeof value !== type;
}
