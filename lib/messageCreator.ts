import { Message } from './types';

export interface MessageCreator<Payload> {
  type: string;

  (payload?: Payload): Message<Payload>;
}

export function messageCreator<Payload>(type: string): MessageCreator<Payload> {
  return Object.assign(
    (payload?: Payload) =>
      payload !== undefined
        ? {
          type,
          payload
        }
        : { type },
    {
      type,
      toString: () => type
    }
  );
}
