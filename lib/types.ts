export interface Message<TPayload = unknown> {
  type: string;
  payload?: TPayload;
}

export type MessageHandler<TPayload = unknown, TResult = unknown> = (
  message: Message<TPayload>
) => TResult;

export interface MessageBus {
  handlerCount: (type: string) => number;
  post: (message: Message) => Promise<unknown[]>;
  postAll: (message: Message[]) => Promise<unknown[]>;
  register: (type: string, handler: MessageHandler) => () => void;
  unregisterAll: (...types: string[]) => void;
}
