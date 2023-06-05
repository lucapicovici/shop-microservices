import { Message } from 'node-nats-streaming';
import {
  Subjects,
  Listener,
  ProductUpdatedEvent,
} from '@iceydc-projects/shop-common';
import { Product } from '../../models/product';
import { queueGroupName } from './queue-group-name';

export class ProductUpdatedListener extends Listener<ProductUpdatedEvent> {
  subject: Subjects.ProductUpdated = Subjects.ProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ProductUpdatedEvent['data'], msg: Message) {
    const product = await Product.findByEvent(data);

    if (!product) {
      throw new Error('Product not found');
    }

    const { title, price, description } = data;
    product.set({ title, price, description });
    await product.save();

    msg.ack();
  }
}
