import {
  Listener,
  OrderCancelledEvent,
  Subjects,
} from '@iceydc-projects/shop-common';
import { Message } from 'node-nats-streaming';
import { Product } from '../../models/product';
import { ProductUpdatedPublisher } from '../publishers/product-updated-publisher';
import { queueGroupName } from './queue-group-name';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    const product = await Product.findById(data.product.id);

    if (!product) {
      throw new Error('Product not found');
    }

    product.set({ orderId: undefined });
    await product.save();

    await new ProductUpdatedPublisher(this.client).publish({
      id: product.id,
      orderId: product.orderId,
      userId: product.userId,
      price: product.price,
      title: product.title,
      description: product.description,
      version: product.version,
    });

    msg.ack();
  }
}
