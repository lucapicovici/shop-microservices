import {
  Listener,
  OrderCreatedEvent,
  Subjects,
} from '@iceydc-projects/shop-common';
import { Message } from 'node-nats-streaming';
import { Product } from '../../models/product';
import { ProductUpdatedPublisher } from '../publishers/product-updated-publisher';
import { queueGroupName } from './queue-group-name';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // Find the product that the order is reserving
    const product = await Product.findById(data.product.id);

    // If no product, throw error
    if (!product) {
      throw new Error('Product not found');
    }

    // Mark the product as being reserved, by setting its orderId property
    product.set({ orderId: data.id });

    // Save the product
    await product.save();

    // Publish event
    await new ProductUpdatedPublisher(this.client).publish({
      id: product.id,
      price: product.price,
      title: product.title,
      description: product.description,
      version: product.version,
      userId: product.userId,
      orderId: product.orderId,
    });

    // Ack the message
    msg.ack();
  }
}
