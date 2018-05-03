export function contracts(t: any) {
  const MessageBusContract = t.interface(
    {
      postAll: t.Function,
      post: t.Function,
      register: t.Function,
      unregisterAll: t.Function,
      handlerCount: t.Function
    },
    { name: 'MessageBus' }
  );

  const MessageContract = t.interface(
    {
      type: t.String,
      payload: t.maybe(t.Any)
    },
    { name: 'MessageContract' }
  );

  return {
    MessageBusContract,
    MessageContract
  };
}
