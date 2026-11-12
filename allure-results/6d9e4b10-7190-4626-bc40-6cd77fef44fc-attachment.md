# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-read.spec.ts >> Retrieving a created booking returns matching details
- Location: tests\API\booking-read.spec.ts:22:6

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: [Function status]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { endpoints } from '../../config/endpoints';
  3  | import { bookingData } from '../../test-data/booking.data';
  4  | 
  5  | test("Listing bookings returns booking IDs",async({request})=>{
  6  | 
  7  |  const response = await request.get(endpoints.bookings);
  8  |  expect(response.status()).toBe(200);
  9  |   const bookings =await  response.json();
  10 |   console.log(bookings);
  11 |   expect(Array.isArray(bookings)).toBe(true);
  12 |   for(const booking of bookings)
  13 |   {
  14 |      expect(Number.isInteger(booking.bookingid)).toBe(true);
  15 |      expect(booking.bookingid).toBeGreaterThan(0);
  16 | 
  17 |   }
  18 | 
  19 | })
  20 | 
  21 | 
  22 | test.only("Retrieving a created booking returns matching details",async({request})=>{
  23 |  const createResponse =await  request.post(endpoints.bookings,{data:bookingData});
> 24 |  expect(createResponse.status).toBe(200);
     |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  25 |  const createdBooking = await createResponse.json();
  26 |  const bookingId=createdBooking.bookingId;
  27 |  const retrievingBookings= await request.get(endpoints.bookingById(bookingId));
  28 |  expect(retrievingBookings.status).toBe(200);
  29 |  const booking = await retrievingBookings.json();
  30 | expect(booking).toEqual(bookingData);
  31 | 
  32 | })
```