export const createRequestDeduper = () => {
  let pendingRequest: Promise<unknown> | null = null;

  return <T>(request: () => Promise<T>): Promise<T> => {
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }

    pendingRequest = request().finally(() => {
      pendingRequest = null;
    });

    return pendingRequest as Promise<T>;
  };
};
