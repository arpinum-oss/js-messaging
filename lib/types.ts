export interface Message<TPayload> {
  type: string;
  payload?: TPayload;
}

export type AnyMessage = Message<any>;

export type MessageHandler<TPayload, TResult> = (
  message: Message<TPayload>
) => TResult;

export type AnyMessageHandler = MessageHandler<any, any>;

export interface MessageBus {
  handlerCount: (type: string) => number;
  post: (message: AnyMessage) => Promise<any>;
  postAll: (message: AnyMessage[]) => Promise<any>;
  register: (type: string, handler: AnyMessageHandler) => () => void;
  unregisterAll: (...types: string[]) => void;
}
