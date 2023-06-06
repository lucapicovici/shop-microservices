import {
  ExpirationCompleteEvent,
  Publisher,
  Subjects,
} from '@iceydc-projects/shop-common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
