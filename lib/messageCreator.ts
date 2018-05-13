import { Message } from './types';

export type MessageCreator<TPayload> = (
  payload?: TPayload
) => Message<TPayload>;

export function messageCreator<TPayload>(
  type: string
): MessageCreator<TPayload> {
  const creator: MessageCreator<TPayload> = payload => {
    if (payload !== undefined) {
      return { type, payload };
    }
    return { type };
  };
  creator.toString = () => type;
  return creator;
}
