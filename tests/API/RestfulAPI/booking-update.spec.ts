
import { test, expect } from '@playwright/test';
import { endpoints } from '../../../config/endpoints';
import { invalidToken } from '../../../test-data/auth.data';
import { bookingTestData } from '../../../test-data/booking.data';
import { createBookingData, createPartialBookingData } from '../../../utils/booking.utils';

test("Retrieving a created booking returns matching details",async({request})=>{
  const bookingData = createBookingData();
  const updatedBookingData = { ...createBookingData(), additionalneeds: bookingTestData.updatedAdditionalneeds };
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;
//auth token 
const authresponse = await request.post(endpoints.auth, {
    data: {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    },
  });

  expect(authresponse.status()).toBe(200);

  const authbody = await authresponse.json();
  const authtoken=authbody.token;
  
  //update
const updateResponse = await request.put(
  endpoints.bookingById(bookingId),
  {
    headers: {
      Cookie: `token=${authtoken}`,
    },
    data: updatedBookingData,
  },
);


 expect(updateResponse.status()).toBe(200);
 const updateResponseDate= await updateResponse.json();
 expect(updateResponseDate).toEqual(updatedBookingData);

 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(200);
  const getResponseData= await getresponse.json();
 expect(getResponseData).toEqual(updatedBookingData)



});
test("Partial update changes selected fields and preserves other details",async({request})=>{
  const bookingData = createBookingData();
  const partialBookingData = createPartialBookingData();
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;
//auth token 
const authresponse = await request.post(endpoints.auth, {
    data: {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    },
  });

  expect(authresponse.status()).toBe(200);

  const authbody = await authresponse.json();
  const authtoken=authbody.token;
  
  //partialupdate
const partialupdateResponse = await request.patch(
  endpoints.bookingById(bookingId),
  {
    headers: {
      Cookie: `token=${authtoken}`,
    },
    data: partialBookingData,
  },
);


 expect(partialupdateResponse.status()).toBe(200);
 const partialupdateResponseDate= await partialupdateResponse.json();
 expect(partialupdateResponseDate).toMatchObject(partialBookingData);

 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(200);
 const getResponseData= await getresponse.json();
 expect(getResponseData).toMatchObject(partialBookingData)
 



});



test("Updating a booking without authentication returns 403 and preserves its original details",async({request})=>{
  const bookingData = createBookingData();
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;
  
  //update
const updateResponse = await request.put(
  endpoints.bookingById(bookingId),
  {
    data: bookingData,
  },
);


 expect(updateResponse.status()).toBe(403);
 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(200);
 const getResponseData= await getresponse.json();
 expect(getResponseData).toMatchObject(bookingData)
 



});


test("Partially updating a booking without authentication returns 403 and preserves its original details",async({request})=>{
  const bookingData = createBookingData();
  const partialBookingData = createPartialBookingData();
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;
  //partialupdate
const partialupdateResponse = await request.patch(
  endpoints.bookingById(bookingId),
  {
    data: partialBookingData,
  },
);


 expect(partialupdateResponse.status()).toBe(403);

 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(200);
 const getResponseData= await getresponse.json();
 expect(getResponseData).toEqual(bookingData);
 



});


test("Updating a booking with an invalid token returns 403 and preserves its original details",async({request})=>{
  const bookingData = createBookingData();
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;
  
  //update
const updateResponse = await request.put(
  endpoints.bookingById(bookingId),
  {
    headers: {
      Cookie: `token=${invalidToken}`,
    },
    data: bookingData,
  }
);

 expect(updateResponse.status()).toBe(403);
 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(200);
 const getResponseData= await getresponse.json();
 expect(getResponseData).toMatchObject(bookingData)
 



});


test("Partially updating a booking with an invalid token returns 403 and preserves its original details",async({request})=>{
  const bookingData = createBookingData();
  const partialBookingData = createPartialBookingData();
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;
  //partialupdate
const partialupdateResponse =await request.put(
  endpoints.bookingById(bookingId),
  {
    headers: {
      Cookie: `token=${invalidToken}`,
    },
    data: partialBookingData,
  }
);

 expect(partialupdateResponse.status()).toBe(403);

 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(200);
 const getResponseData= await getresponse.json();
 expect(getResponseData).toEqual(bookingData);
 



});