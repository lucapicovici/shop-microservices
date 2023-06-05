import {
  Publisher,
  Subjects,
  ProductUpdatedEvent,
} from '@iceydc-projects/shop-common';

export class ProductUpdatedPublisher extends Publisher<ProductUpdatedEvent> {
  subject: Subjects.ProductUpdated = Subjects.ProductUpdated;
}
