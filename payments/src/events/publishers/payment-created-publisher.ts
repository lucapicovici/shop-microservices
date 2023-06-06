import {
  PaymentCreatedEvent,
  Publisher,
  Subjects,
} from '@iceydc-projects/shop-common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
