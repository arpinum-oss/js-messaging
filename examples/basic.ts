import { createMessageBus } from "../lib";

const bus = createMessageBus();
bus.register("PrintText", (message) => console.log(message.payload));
bus.post({ type: "PrintText", payload: "Hello world" }).catch(console.error);

// Hello world
