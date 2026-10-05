export const getDisplayHappyCustomers = (items = []) =>
  [...items]
    .filter((item) => item?.imageUrl?.trim())
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0));

export const buildHappyCustomerMarqueeItems = (items) =>
  [...items];
