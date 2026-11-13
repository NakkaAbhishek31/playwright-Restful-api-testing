import{test,request, expect} from "@playwright/test"
import { endpoints } from "../../../config/endpoints"
import { invalidToken } from "../../../test-data/auth.data";
import { createBookingData } from "../../../utils/booking.utils";

test("deleting a created booking",async({request})=>{
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


test("Deleting a booking without authentication returns 403 and preserves the booking",async({request})=>{
  const bookingData = createBookingData();
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;
  
  //delete
  const deleteresponse= await request.delete(endpoints.bookingById(bookingId));

    expect(deleteresponse.status()).toBe(403);
    
    //get method 

 const getresponse = await  request.get(endpoints.bookingById(bookingId));
 expect(getresponse.status()).toBe(200);
 const getresponseData = await getresponse.json();
 expect(getresponseData).toEqual(bookingData);
});



test("Deleting a booking with an invalid token returns 403 and preserves the booking",async({request})=>{
  const bookingData = createBookingData();
  const bookingresponse = await request.post(endpoints.bookings,{data:bookingData});
  expect(bookingresponse.status()).toBe(200);
  const createdBooking=await bookingresponse.json();
  console.log(createdBooking);
  expect(Number.isInteger(createdBooking.bookingid)).toBe(true);
  expect(createdBooking.bookingid).toBeGreaterThan(0);
  expect(createdBooking.booking).toEqual(bookingData);
   const bookingId = createdBooking.bookingid;  
  //delete
  const deleteresponse= await request.delete(endpoints.bookingById(bookingId),{ headers: {
      Cookie: `token=${invalidToken}`,
    },});

    expect(deleteresponse.status()).toBe(403);
    
    //get method 

 const getresponse = await  request.get(endpoints.bookingById(bookingId));

 const getResponseData=await getresponse.json();
 expect(getResponseData).toEqual(bookingData);

});