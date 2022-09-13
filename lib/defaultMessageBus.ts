import { assert } from "@arpinum/defender";
import { pipe, mapWithOptions as mapToPromises } from "@arpinum/promising";

import { Message, MessageBus, MessageHandler } from "./types";

export interface MessageBusOptions {
  log?: (...args: unknown[]) => void;
  exclusiveHandlers?: boolean;
  ensureAtLeastOneHandler?: boolean;
  handlersConcurrency?: number;
  beforePost?: MessageHookOption[];
  afterPost?: ResultsHookOption[];
  beforeHandle?: MessageHookOption[];
  afterHandle?: ResultHookOption[];
}

export type MessageBusSafeOptions = Required<MessageBusOptions>;
export type MessageHookOption = (
  message: Message
) => Promise<Message> | Message;
type MessageHook = (message: Message) => Promise<Message>;
export type ResultHookOption = (result: unknown) => Promise<unknown> | unknown;
type ResultHook = (result: unknown) => Promise<unknown>;
export type ResultsHookOption = (
  result: unknown[]
) => Promise<unknown[]> | unknown[];
type ResultsHook = (result: unknown[]) => Promise<unknown[]>;

const defaultOptions: MessageBusSafeOptions = {
  log: () => {
    //noop
  },
  exclusiveHandlers: false,
  ensureAtLeastOneHandler: false,
  handlersConcurrency: 3,
  beforePost: [],
  afterPost: [],
  beforeHandle: [],
  afterHandle: [],
};

export class DefaultMessageBus implements MessageBus {
  private options: MessageBusSafeOptions;
  private handlerMap: Map<string, MessageHandler[]>;
  private readonly beforeHandle: MessageHook;
  private readonly afterHandle: ResultHook;
  private readonly beforePost: MessageHook;
  private readonly afterPost: ResultsHook;

  constructor(options: MessageBusOptions = {}) {
    this.validateOptions(options);
    this.options = Object.assign({}, defaultOptions, options);
    this.handlerMap = new Map();
    this.beforeHandle = pipe(this.options.beforeHandle);
    this.afterHandle = pipe(this.options.afterHandle);
    this.beforePost = pipe(this.options.beforePost);
    this.afterPost = pipe(this.options.afterPost);
  }

  private validateOptions(options: MessageBusOptions) {
    assert(options.log, "options#log").toBeAFunction();
    assert(
      options.exclusiveHandlers,
      "options#exclusiveHandlers"
    ).toBeABoolean();
    assert(
      options.ensureAtLeastOneHandler,
      "options#ensureAtLeastOneHandler"
    ).toBeABoolean();
    assert(
      options.handlersConcurrency,
      "options#handlersConcurrency"
    ).toBeANumber();
    assert(options.beforePost, "options#beforePost").toBeAnArray();
    assert(options.beforeHandle, "options#beforeHandle").toBeAnArray();
    assert(options.afterHandle, "options#afterHandle").toBeAnArray();
    assert(options.afterPost, "options#afterPost").toBeAnArray();
  }

  public postAll(messages: Message[]): Promise<unknown[]> {
    if (messages.length === 0) {
      return Promise.resolve([]);
    }
    if (messages.length === 1) {
      return this.post(messages[0]).then((r) => [r]);
    }
    return mapToPromises(
      (message: Message) => this.post(message),
      { concurrency: 3 },
      messages
    );
  }

  public post(message: Message): Promise<unknown[]> {
    return this.validatedMessage(message)
      .then(this.beforePost)
      .then((message) => this.postToHandlers(message))
      .then(this.afterPost);
  }

  private postToHandlers(messageToPost: Message) {
    this.options.log(`Posting ${messageToPost.type}`);
    const handlers = this.handlersFor(messageToPost.type);
    this.checkHandlerRequirements(messageToPost, handlers);
    if (this.options.exclusiveHandlers) {
      return this.postForExclusiveHandlers(messageToPost, handlers);
    }
    return this.postForStandardHandlers(messageToPost, handlers);
  }

  private validatedMessage(messageToValidate: Message): Promise<Message> {
    try {
      assert(messageToValidate, "message").toBePresent();
      assert(messageToValidate.type, "message#type")
        .toBePresent()
        .toBeAString();
      return Promise.resolve(messageToValidate);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  private checkHandlerRequirements(
    messageToCheck: Message,
    handlers: MessageHandler[]
  ) {
    if (handlers.length === 0 && this.options.ensureAtLeastOneHandler) {
      throw new Error(`No handler for ${messageToCheck.type}`);
    }
  }

  private async postForExclusiveHandlers(
    messageToPost: Message,
    handlers: MessageHandler[]
  ) {
    if (handlers.length === 0) {
      return Promise.resolve([]);
    }
    const result = await this.handle(messageToPost, handlers[0]);
    return [result];
  }

  private postForStandardHandlers(
    messageToPost: Message,
    handlers: MessageHandler[]
  ) {
    if (handlers.length === 0) {
      return Promise.resolve([]);
    }
    if (handlers.length === 1) {
      return this.handle(messageToPost, handlers[0]).then((r) => [r]);
    }
    const handleMessage = (handler: MessageHandler) =>
      this.handle(messageToPost, handler);
    return mapToPromises(
      handleMessage,
      { concurrency: this.options.handlersConcurrency },
      handlers
    );
  }

  private handle(message: Message, handler: MessageHandler) {
    return this.beforeHandle(message).then(handler).then(this.afterHandle);
  }

  public register(type: string, handler: MessageHandler): () => void {
    validateArgs();
    this.options.log(`Registering to ${type}`);
    const handlers = this.handlersFor(type);
    this.ensureHandlerExclusivity(handlers, type);
    this.updateHandlers(type, handlers.concat(handler));
    return () =>
      this.updateHandlers(
        type,
        this.handlersFor(type).filter((h) => h !== handler)
      );

    function validateArgs() {
      assert(type, "type").toBePresent();
      assert(handler, "handler").toBePresent().toBeAFunction();
    }
  }

  private ensureHandlerExclusivity(handlers: MessageHandler[], type: string) {
    if (this.options.exclusiveHandlers && handlers.length > 0) {
      const message =
        `Won't allow a new handler for type ${type} ` +
        `since handlers are exclusive`;
      throw new Error(message);
    }
  }

  public unregisterAll(...types: string[]): void {
    validateArgs();
    types.forEach((type) => this.updateHandlers(type, []));

    function validateArgs() {
      types.forEach((type, i) => assert(type, `types[${i}]`).toBeAString());
    }
  }

  public handlerCount(type: string): number {
    assert(type, "type").toBeAString();
    return this.handlersFor(type).length;
  }

  private handlersFor(messageType: string) {
    return this.handlerMap.get(messageType) || [];
  }

  private updateHandlers(messageType: string, handlers: MessageHandler[]) {
    this.handlerMap.set(messageType, handlers);
  }
}
