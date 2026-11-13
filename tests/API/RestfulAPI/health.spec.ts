import{test,expect} from "@playwright/test"
import { endpoints } from "../../../config/endpoints";

test("Verify the Restful Booker API is available.",async({request})=>{

const response = await request.get(endpoints.health);
  expect(response.status()).toBe(201);
});
