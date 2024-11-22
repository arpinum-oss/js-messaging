import { Message } from "./types";

export interface MessageCreator<Payload> {
  type: string;

  (payload: Payload): Message<Payload>;
}

export function messageCreator<Payload = unknown>(
  type: string,
): MessageCreator<Payload> {
  return Object.assign(
    (payload: Payload) => ({
      type,
      payload,
    }),
    typeInformation(type),
  );
}

export interface VoidMessageCreator {
  type: string;

  (): Message;
}

export function voidMessageCreator(type: string): VoidMessageCreator {
  return Object.assign(
    () => ({
      type,
    }),
    typeInformation(type),
  );
}

function typeInformation(type: string) {
  return {
    type,
    toString: () => type,
  };
}
