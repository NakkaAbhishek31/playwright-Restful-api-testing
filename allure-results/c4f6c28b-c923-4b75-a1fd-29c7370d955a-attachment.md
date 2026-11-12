# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-update.spec.ts >> Partial update changes selected fields and preserves other details
- Location: tests\API\booking-update.spec.ts:51:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 7

  Object {
+   "additionalneeds": "Breakfast",
+   "bookingdates": Object {
+     "checkin": "2027-01-10",
+     "checkout": "2027-01-15",
+   },
+   "depositpaid": true,
    "firstname": "Alice",
    "lastname": "Wilson",
+   "totalprice": 150,
  }
```

# Test source

```ts
  1  | 
  2  | import { test, expect } from '@playwright/test';
  3  | import { endpoints } from '../../config/endpoints';
  4  | import { bookingData,updatedBookingData,partialBookingData  } from '../../test-data/booking.data';
  5  | test("Retrieving a created booking returns matching details",async({request})=>{
  6  |   const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  7  |   expect(bookingresponse.status()).toBe(200);
  8  |   const createdBooking=await bookingresponse.json();
  9  |   console.log(createdBooking);
  10 |   expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  11 |   expect(createdBooking.bookingid).toBeGreaterThan(0);
  12 |   expect(createdBooking.booking).toEqual(bookingData);
  13 |    const bookingId = createdBooking.bookingid;
  14 | //auth token 
  15 | const authresponse = await request.post(endpoints.auth, {
  16 |     data: {
  17 |       username: process.env.API_USERNAME,
  18 |       password: process.env.API_PASSWORD,
  19 |     },
  20 |   });
  21 | 
  22 |   expect(authresponse.status()).toBe(200);
  23 | 
  24 |   const authbody = await authresponse.json();
  25 |   const authtoken=authbody.token;
  26 |   
  27 |   //update
  28 | const updateResponse = await request.put(
  29 |   endpoints.bookingById(bookingId),
  30 |   {
  31 |     headers: {
  32 |       Cookie: `token=${authtoken}`,
  33 |     },
  34 |     data: updatedBookingData,
  35 |   },
  36 | );
  37 | 
  38 | 
  39 |  expect(updateResponse.status()).toBe(200);
  40 |  const updateResponseDate= await updateResponse.json();
  41 |  expect(updateResponseDate).toEqual(updatedBookingData);
  42 | 
  43 |  const getresponse = await  request.get(endpoints.bookingById(bookingId));
  44 |  expect(getresponse.status()).toBe(200);
  45 |   const getResponseData= await getresponse.json();
  46 |  expect(getResponseData).toEqual(updatedBookingData)
  47 | 
  48 | 
  49 | 
  50 | });
  51 | test("Partial update changes selected fields and preserves other details",async({request})=>{
  52 |   const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  53 |   expect(bookingresponse.status()).toBe(200);
  54 |   const createdBooking=await bookingresponse.json();
  55 |   console.log(createdBooking);
  56 |   expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  57 |   expect(createdBooking.bookingid).toBeGreaterThan(0);
  58 |   expect(createdBooking.booking).toEqual(bookingData);
  59 |    const bookingId = createdBooking.bookingid;
  60 | //auth token 
  61 | const authresponse = await request.post(endpoints.auth, {
  62 |     data: {
  63 |       username: process.env.API_USERNAME,
  64 |       password: process.env.API_PASSWORD,
  65 |     },
  66 |   });
  67 | 
  68 |   expect(authresponse.status()).toBe(200);
  69 | 
  70 |   const authbody = await authresponse.json();
  71 |   const authtoken=authbody.token;
  72 |   
  73 |   //partialupdate
  74 | const partialupdateResponse = await request.patch(
  75 |   endpoints.bookingById(bookingId),
  76 |   {
  77 |     headers: {
  78 |       Cookie: `token=${authtoken}`,
  79 |     },
  80 |     data: partialBookingData,
  81 |   },
  82 | );
  83 | 
  84 | 
  85 |  expect(partialupdateResponse.status()).toBe(200);
  86 |  const partialupdateResponseDate= await partialupdateResponse.json();
> 87 |  expect(partialupdateResponseDate).toEqual(partialBookingData);
     |                                    ^ Error: expect(received).toEqual(expected) // deep equality
  88 | 
  89 |  const getresponse = await  request.get(endpoints.bookingById(bookingId));
  90 |  expect(getresponse.status()).toBe(200);
  91 |  const getResponseData= await getresponse.json();
  92 |  expect(getResponseData).toEqual(partialBookingData)
  93 |  
  94 | 
  95 | 
  96 | 
  97 | });
```