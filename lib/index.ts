import { DefaultMessageBus, MessageBusOptions } from "./defaultMessageBus";
import { MessageBus } from "./types";

export * from "./defaultMessageBus";
export * from "./messageCreator";
export * from "./types";

export function createMessageBus(options: MessageBusOptions = {}): MessageBus {
  return new DefaultMessageBus(options);
}
