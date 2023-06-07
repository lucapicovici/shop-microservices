import { Product } from '../product';

it('implements optimistic concurrency control', async () => {
  // Create an instance of the product
  const product = Product.build({
    title: 'Marshall JCM800',
    price: 2000,
    description: 'Lorem ipsum',
    userId: '123',
  });

  // Save the product to the database
  await product.save();

  // Fetch the product twice
  const firstInstance = await Product.findById(product.id);
  const secondInstance = await Product.findById(product.id);

  // Make two separate changes to the products we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 15 });

  // Save the first fetched product
  await firstInstance!.save();

  // Save the second fetched product and expect an error
  try {
    await secondInstance!.save();
  } catch (err) {
    return;
  }

  throw new Error('Should not reach this point');
});

it('increments the version number on multiple saves', async () => {
  const product = Product.build({
    title: 'Marshall JCM800',
    price: 2000,
    description: 'Lorem ipsum',
    userId: '123',
  });

  await product.save();
  expect(product.version).toEqual(0);

  await product.save();
  expect(product.version).toEqual(1);

  await product.save();
  expect(product.version).toEqual(2);
});