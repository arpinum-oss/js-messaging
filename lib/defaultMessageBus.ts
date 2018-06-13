import { assert } from '@arpinum/defender';
import { compose, mapWithOptions as mapToPromises } from '@arpinum/promising';

import { Message, MessageBus, MessageHandler } from './types';

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

export class DefaultMessageBus implements MessageBus {
  private options: MessageBusOptions;
  private handlerMap: Map<string, MessageHandler[]>;
  private beforeHandle: (m: Message) => Promise<Message>;
  private afterHandle: (r: any) => Promise<any>;
  private beforePost: (m: Message) => Promise<Message>;
  private afterPost: (r: any) => Promise<any>;

  constructor(options: MessageBusOptions = {}) {
    this.validateOptions(options);
    this.options = Object.assign({}, defaultOptions, options);
    this.handlerMap = new Map();
    this.beforeHandle = compose(this.options.beforeHandle);
    this.afterHandle = compose(this.options.afterHandle);
    this.beforePost = compose(this.options.beforePost);
    this.afterPost = compose(this.options.afterPost);
  }

  private validateOptions(options: MessageBusOptions) {
    assert(options.log, 'options#log').toBeAFunction();
    assert(
      options.exclusiveHandlers,
      'options#exclusiveHandlers'
    ).toBeABoolean();
    assert(
      options.ensureAtLeastOneHandler,
      'options#ensureAtLeastOneHandler'
    ).toBeABoolean();
    assert(
      options.handlersConcurrency,
      'options#handlersConcurrency'
    ).toBeANumber();
    assert(options.beforePost, 'options#beforePost').toBeAnArray();
    assert(options.beforeHandle, 'options#beforeHandle').toBeAnArray();
    assert(options.afterHandle, 'options#afterHandle').toBeAnArray();
    assert(options.afterPost, 'options#afterPost').toBeAnArray();
  }

  public postAll(messages: Message[]) {
    if (messages.length === 0) {
      return Promise.resolve([]);
    }
    if (messages.length === 1) {
      return this.post(messages[0]).then(r => [r]);
    }
    return mapToPromises(
      message => this.post(message),
      { concurrency: 3 },
      messages
    );
  }

  public post(message: Message) {
    const self = this;
    return validatedMessage(message)
      .then(this.beforePost)
      .then(postToHandlers)
      .then(this.afterPost);

    function postToHandlers(messageToPost: Message) {
      self.options.log(`Posting ${messageToPost.type}`);
      const handlers = self.handlersFor(messageToPost.type);
      checkHandlerRequirements(messageToPost, handlers);
      if (self.options.exclusiveHandlers) {
        return postForExclusiveHandlers(messageToPost, handlers);
      }
      return postForStandardHandlers(messageToPost, handlers);
    }

    function validatedMessage(
      messageToValidate: Message
    ): Promise<Message> {
      try {
        assert(messageToValidate, 'message').toBePresent();
        assert(messageToValidate.type, 'message#type')
          .toBePresent()
          .toBeAString();
        return Promise.resolve(message);
      } catch (e) {
        return Promise.reject(e);
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
      if (handlers.length === 1) {
        return self.handle(messageToPost, handlers[0]).then(r => [r]);
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
    return this.beforeHandle(message)
      .then(handler)
      .then(this.afterHandle);
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
      assert(type, 'type').toBePresent();
      assert(handler, 'handler')
        .toBePresent()
        .toBeAFunction();
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
      types.forEach((type, i) => assert(type, `types[${i}]`).toBeAString());
    }
  }

  public handlerCount(type: string) {
    assert(type, 'type').toBeAString();
    return this.handlersFor(type).length;
  }

  private handlersFor(messageType: string) {
    return this.handlerMap.get(messageType) || [];
  }

  private updateHandlers(messageType: string, handlers: MessageHandler[]) {
    this.handlerMap.set(messageType, handlers);
  }
}
