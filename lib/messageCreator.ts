import { Message } from './types';

export interface MessageCreator<Payload> {
  type: string;

  (payload: Payload): Message<Payload>;
}

export function messageCreator<Payload=any>(type: string): MessageCreator<Payload> {
  return Object.assign(
    (payload: Payload) => ({
      type,
      payload
    }),
    {
      type,
      toString: () => type
    }
  );
}
