import {
  Subjects,
  Publisher,
  OrderCancelledEvent,
} from '@iceydc-projects/shop-common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
