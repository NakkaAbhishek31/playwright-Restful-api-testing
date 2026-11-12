import { test, expect } from '@playwright/test';
import { endpoints } from '../../config/endpoints';
import { createBookingData } from '../../test-data/booking.data';

test("Listing bookings returns booking IDs",async({request})=>{

 const response = await request.get(endpoints.bookings);
 expect(response.status()).toBe(200);
  const bookings =await  response.json();
  console.log(bookings);
  expect(Array.isArray(bookings)).toBe(true);
  for(const booking of bookings)
  {
     expect(Number.isInteger(booking.bookingid)).toBe(true);
     expect(booking.bookingid).toBeGreaterThan(0);

  }

})


test("Retrieving a created booking returns matching details",async({request})=>{
  const bookingData = createBookingData();
 const createResponse =await  request.post(endpoints.bookings,{data:bookingData});
 expect(createResponse.status()).toBe(200);
 const createdBooking = await createResponse.json();
 const bookingId = createdBooking.bookingid;
 expect(Number.isInteger(bookingId)).toBe(true);
 expect(bookingId).toBeGreaterThan(0);
 const response = await request.get(endpoints.bookingById(bookingId));
 expect(response.status()).toBe(200);
 const booking = await response.json();
 console.log(booking);
 expect(booking).toEqual(bookingData);
});