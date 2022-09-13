import { createMessageBus, MessageHookOption } from "../lib";

const withUpperCaseText: MessageHookOption = (m) => ({
  ...m,
  payload: typeof m.payload === "string" ? m.payload.toUpperCase() : m.payload,
});
const withoutSpaceInText: MessageHookOption = (m) => ({
  ...m,
  payload:
    typeof m.payload === "string" ? m.payload.replace(" ", "-") : m.payload,
});

const bus = createMessageBus({
  beforeHandle: [withUpperCaseText, withoutSpaceInText],
});
bus.register("PrintText", (message) => console.log(message.payload));
bus.post({ type: "PrintText", payload: "Hello world" }).catch(console.error);

// HELLO-WORLD
