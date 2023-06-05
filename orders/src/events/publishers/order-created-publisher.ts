import {
  Publisher,
  OrderCreatedEvent,
  Subjects,
} from '@iceydc-projects/shop-common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
