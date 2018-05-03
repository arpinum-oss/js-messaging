import { DefaultMessageBus, MessageBusOptions } from './defaultMessageBus';
import { MessageBus } from './types';

export * from './contracts';
export * from './defaultMessageBus';
export * from './types';

export function createMessageBus(options: MessageBusOptions = {}): MessageBus {
  return new DefaultMessageBus(options);
}
