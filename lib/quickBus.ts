import { AnyMessage, AnyMessageHandler, MessageBus } from './types';

export class QuickBus implements MessageBus {
  private handlerMap = new Map<string, AnyMessageHandler[]>();

  public post(message: AnyMessage) {
    try {
      validateArgs();
    } catch (e) {
      return Promise.reject(e);
    }
    const handlers = this.handlerMap.get(message.type) || [];
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

  public register(type: string, handler: AnyMessageHandler) {
    validateArgs();
    const handlers = (this.handlerMap.get(type) || []).concat(handler);
    this.handlerMap.set(type, handlers);
    return () => {
      return;
    };

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

  public handlerCount(_: string) {
    return 0;
  }

  public postAll(_: AnyMessage[]) {
    return Promise.resolve([]);
  }

  public unregisterAll(..._: string[]) {
    return;
  }
}
