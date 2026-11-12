import { test, expect } from '@playwright/test';
import { endpoints } from '../../config/endpoints';
import { createBookingData } from '../../test-data/booking.data';
test("Retrieving a created booking returns matching details",async({request})=>{
  const bookingData = createBookingData();
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
  
  //delete
  const deleteresponse= await request.delete(endpoints.bookingById(bookingId),{ headers: {
      Cookie: `token=${authtoken}`,
    },});

    expect(deleteresponse.status()).toBe(201);
    
    //get method 

 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(404);





});