import{test,request, expect} from "@playwright/test"
import { endpoints } from "../../config/endpoints"
import { createBookingData } from '../../test-data/booking.data';

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