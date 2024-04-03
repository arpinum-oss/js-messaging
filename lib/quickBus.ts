import { Message, MessageBus, MessageHandler } from "./types";

export class QuickBus implements MessageBus {
  private handlerMap = new Map<string, MessageHandler[]>();

  public post(message: Message): Promise<unknown[]> {
    try {
      validateArgs();
    } catch (e) {
      return Promise.reject(e);
    }
    const handlers = this.handlerMap.get(message.type) || [];
    return Promise.all(handlers.map((h) => h(message)));

    function validateArgs() {
      if (!message) {
        throw new Error("Missing message");
      }
      if (!message.type) {
        throw new Error("Missing message type");
      }
    }
  }

  public register(type: string, handler: MessageHandler): () => void {
    validateArgs();
    const handlers = (this.handlerMap.get(type) || []).concat(handler);
    this.handlerMap.set(type, handlers);
    return () => {
      return;
    };

    function validateArgs() {
      if (!type) {
        throw new Error("Missing type");
      }
      if (!handler) {
        throw new Error("Missing handler");
      }
      if (handler.constructor.name !== "Function") {
        throw new Error("Handler must be a function");
      }
    }
  }

  public handlerCount(): number {
    return 0;
  }

  public postAll(): Promise<unknown[]> {
    return Promise.resolve([]);
  }

  public unregisterAll(): void {
    return;
  }
}
