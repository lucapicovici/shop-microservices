import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { ProductUpdatedEvent } from '@iceydc-projects/shop-common';
import { ProductUpdatedListener } from '../product-updated-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Product } from '../../../models/product';

const setup = async () => {
  // Create a listener
  const listener = new ProductUpdatedListener(natsWrapper.client);

  // Create and save a product
  const product = Product.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Marshall JCM800',
    price: 2000,
    description: '100W Tube Amp Head',
  });
  await product.save();

  // Create a fake data object
  const data: ProductUpdatedEvent['data'] = {
    id: product.id,
    version: product.version + 1,
    title: 'Neural DSP Quad Cortex',
    price: 2500,
    description: 'The best amp modeller',
    userId: 'ablskdjf',
  };

  // Create a fake msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { msg, data, product, listener };
};

it('finds, updates, and saves a product', async () => {
  const { msg, data, product, listener } = await setup();

  await listener.onMessage(data, msg);

  const updatedProduct = await Product.findById(product.id);

  expect(updatedProduct!.title).toEqual(data.title);
  expect(updatedProduct!.price).toEqual(data.price);
  expect(updatedProduct!.description).toEqual(data.description);
  expect(updatedProduct!.version).toEqual(data.version);
});

it('acks the message', async () => {
  const { msg, data, listener } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has a skipped version number', async () => {
  const { msg, data, listener, product } = await setup();

  data.version = 10;

  try {
    await listener.onMessage(data, msg);
  } catch (err) {}

  expect(msg.ack).not.toHaveBeenCalled();
});
