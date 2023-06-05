import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Product } from '../../models/product';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';

it('marks an order as cancelled', async () => {
  // create a product with Product Model
  const product = Product.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Marshall JCM800',
    price: 2000,
    description: '100W Tube Amp Head',
  });
  await product.save();

  const user = global.signin();
  // make a request to create an order
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ productId: product.id })
    .expect(201);

  // make a request to cancel the order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(204);

  // expectation to make sure the thing is cancelled
  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emits an order cancelled event', async () => {
  const product = Product.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Marshall JCM800',
    price: 2000,
    description: '100W Tube Amp Head',
  });
  await product.save();

  const user = global.signin();
  // make a request to create an order
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ productId: product.id })
    .expect(201);

  // make a request to cancel the order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(204);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
