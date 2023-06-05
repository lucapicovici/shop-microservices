import { OrderCreatedEvent, OrderStatus } from '@iceydc-projects/shop-common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Product } from '../../../models/product';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCreatedListener } from '../order-created-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create and save a product
  const product = Product.build({
    title: 'Marshall JCM800',
    price: 2000,
    description: '100W Tube Amp Head',
    userId: 'asdffdsa',
  });
  await product.save();

  // Create the fake data event
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: 'asdffdsa',
    product: {
      id: product.id,
      price: product.price,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, product };
};

it('sets the orderId of the product', async () => {
  const { listener, data, product, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedProduct = await Product.findById(product.id);

  expect(updatedProduct!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a product updated event', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const productUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  expect(data.id).toEqual(productUpdatedData.orderId);
});
