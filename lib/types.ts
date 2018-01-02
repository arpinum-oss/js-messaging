export interface Message {
  type: string;
  payload?: any;
}

export type MessageHandler = (message: Message) => any;
