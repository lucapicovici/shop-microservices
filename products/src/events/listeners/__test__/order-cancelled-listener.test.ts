import { OrderCancelledEvent } from '@iceydc-projects/shop-common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Product } from '../../../models/product';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = new mongoose.Types.ObjectId().toHexString();
  const product = Product.build({
    title: 'Marshall JCM800',
    price: 2000,
    description: '100W Tube Amp Head',
    userId: 'asdf',
  });
  product.set({ orderId });
  await product.save();

  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    product: {
      id: product.id,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, orderId, product };
};

it('updates the product, publishes an event and acks the message', async () => {
  const { msg, listener, data, orderId, product } = await setup();

  await listener.onMessage(data, msg);

  const updatedProduct = await Product.findById(product.id);
  expect(updatedProduct!.orderId).not.toBeDefined();
  expect(msg.ack).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
