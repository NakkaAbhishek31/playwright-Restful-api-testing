import{test,request, expect} from "@playwright/test"
import { endpoints } from "../../../config/endpoints"
import { createBookingData } from '../../../utils/booking.utils';

test("Creating a booking returns its ID and submitted detail",async({request})=>{
  const bookingData = createBookingData();

   const response = await request.post(endpoints.bookings,{data:bookingData});
   expect(response.status()).toBe(200);
   const body=await response.json();
  console.log(body);
 expect(Number.isInteger(body.bookingid)).toBe(true);
  expect(body.bookingid).toBeGreaterThan(0);
  expect(body.booking).toEqual(bookingData);
})


test("Creating a booking without additionalneeds succeeds",async({request})=>{
  const { additionalneeds, ...bookingData } = createBookingData();

   const response = await request.post(endpoints.bookings,{data:bookingData});
   expect(response.status()).toBe(200);
   const body=await response.json();
  console.log(body);
 expect(Number.isInteger(body.bookingid)).toBe(true);
  expect(body.bookingid).toBeGreaterThan(0);
  expect(body.booking).toMatchObject(bookingData);
})


test("Creating a booking with depositpaid false preserves the false value",async({request})=>{
  const bookingData = {
  ...createBookingData(),
  depositpaid: false,
};
   const response = await request.post(endpoints.bookings,{data:bookingData});
   expect(response.status()).toBe(200);
   const body=await response.json();
  console.log(body);
 expect(Number.isInteger(body.bookingid)).toBe(true);
  expect(body.bookingid).toBeGreaterThan(0);
  expect(body.booking).toMatchObject(bookingData);
  expect(body.booking.depositpaid).toBe(false);
})


test("Creating two bookings with identical details returns different booking IDs",async({request})=>{
  const bookingData = createBookingData();
   const firstresponse = await request.post(endpoints.bookings,{data:bookingData});
   const secondresponse = await request.post(endpoints.bookings,{data:bookingData});
   expect(firstresponse.status()).toBe(200);
   const firstResponseData=await firstresponse.json();
   const firstBookingId= firstResponseData.bookingid
 expect(Number.isInteger(firstResponseData.bookingid)).toBe(true);
  expect(firstResponseData.bookingid).toBeGreaterThan(0);
  expect(firstResponseData.booking).toEqual(bookingData);
     expect(secondresponse.status()).toBe(200);
   const secondtResponseData=await secondresponse.json();
   const secondBookingId= secondtResponseData.bookingid
 expect(Number.isInteger(secondtResponseData.bookingid)).toBe(true);
  expect(secondtResponseData.bookingid).toBeGreaterThan(0);
  expect(secondtResponseData.booking).toEqual(bookingData);
  expect(firstBookingId).not.toBe(secondBookingId);
 console.log(firstBookingId)
 console.log(secondBookingId)
});