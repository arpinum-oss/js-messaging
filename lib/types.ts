export interface Message<TPayload = any> {
  type: string;
  payload?: TPayload;
}

export type MessageHandler<TPayload = any, TResult = any> = (
  message: Message<TPayload>
) => TResult;

export interface MessageBus {
  handlerCount: (type: string) => number;
  post: (message: Message) => Promise<any>;
  postAll: (message: Message[]) => Promise<any>;
  register: (type: string, handler: MessageHandler) => () => void;
  unregisterAll: (...types: string[]) => void;
}
