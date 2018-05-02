export interface Message<T> {
  type: string;
  payload?: T;
}

export type MessageHandler<T> = (message: Message<T>) => any;
