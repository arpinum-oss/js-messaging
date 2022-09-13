import { MessageBus, createMessageBus } from "../lib";
import { QuickBus } from "../lib/quickBus";

const postCount = 100000;

bench().catch(console.error);

async function bench() {
  const messageBus = createMessageBus({ log: () => undefined });
  await benchWith(messageBus, "Message bus");
  const quickBus = new QuickBus();
  await benchWith(quickBus, "Quick bus");
}

async function benchWith(bus: MessageBus, name: string) {
  let handleCount = 0;
  const start = Date.now();

  bus.register("Handle", () => {
    handleCount++;
  });

  await post();
  await printStatistics();

  async function post(): Promise<void> {
    if (handleCount >= postCount) {
      return;
    }
    await bus.post({ type: "Handle" });
    return post();
  }

  function printStatistics() {
    const end = Date.now();
    const duration = end - start;
    const message = `${handleCount} messages handled in ${duration} ms with ${name}`;
    console.log(message);
  }
}
