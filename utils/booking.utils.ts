import { randomInt, randomUUID } from 'node:crypto';
import { bookingTestData } from '../test-data/booking.data';

export function createPartialBookingData() {
  const uniqueId = randomUUID();

  return {
    firstname: `Guest-${uniqueId}`,
    lastname: `Test-${uniqueId}`,
  };
}

export function createBookingData() {
  const checkin = new Date();
  checkin.setUTCDate(checkin.getUTCDate() + randomInt(1, 31));
  const checkout = new Date(checkin);
  checkout.setUTCDate(checkout.getUTCDate() + randomInt(1, 15));

  return {
    ...createPartialBookingData(),
    totalprice: randomInt(100, 1001),
    depositpaid: randomInt(0, 2) === 1,
    bookingdates: {
      checkin: checkin.toISOString().slice(0, 10),
      checkout: checkout.toISOString().slice(0, 10),
    },
    additionalneeds: bookingTestData.additionalneeds,
  };
}
