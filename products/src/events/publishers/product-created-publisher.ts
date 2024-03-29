import {
  Publisher,
  Subjects,
  ProductCreatedEvent,
} from '@iceydc-projects/shop-common';

export class ProductCreatedPublisher extends Publisher<ProductCreatedEvent> {
  subject: Subjects.ProductCreated = Subjects.ProductCreated;
}
