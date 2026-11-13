import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { toolshopEndpoints } from '../../../config/toolshop.endpoints';

const credentials = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../test-data/toolshop-login.json'), 'utf8'),
) as Record<'admin' | 'customer', { email: string; password: string }>;

test.describe('Toolshop role permissions and token tampering', () => {
  test.describe.configure({ mode: 'default' });

  const tokens = { admin: '', customer: '' };

  test.beforeAll(async ({ playwright, baseURL }) => {
    const loginRequest = await playwright.request.newContext({ baseURL });
    try {
      for (const account of ['admin', 'customer'] as const) {
        const response = await loginRequest.post(toolshopEndpoints.login, {
          data: credentials[account],
        });
        expect(response.status(), `${account} login should succeed`).toBe(200);
        const body = await response.json();
        expect(body.access_token).toEqual(expect.any(String));
        expect(body.access_token.length).toBeGreaterThan(0);
        tokens[account] = body.access_token;

        const userResponse = await loginRequest.get(toolshopEndpoints.currentUser, {
          headers: { Authorization: `Bearer ${tokens[account]}` },
        });
        expect(userResponse.status()).toBe(200);
        const user = await userResponse.json();
        expect(user.email).toBe(credentials[account].email);
      }
    } finally {
      await loginRequest.dispose();
    }
  });

  test('An admin can retrieve the user list', async ({ request }) => {
    const response = await request.get(toolshopEndpoints.users, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('A customer cannot retrieve the user list', async ({ request }) => {
    const response = await request.get(toolshopEndpoints.users, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).not.toHaveProperty('data');
  });

  test('A customer cannot gain admin access by modifying their token', async ({ request }) => {
    const parts = tokens.customer.split('.');
    expect(parts).toHaveLength(3);
    const [header, payload, signature] = parts;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    claims.role = 'admin';
    const modifiedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    // Keep the original signature to test rejection of the altered claims.
    const modifiedToken = `${header}.${modifiedPayload}.${signature}`;
    expect(modifiedToken).not.toBe(tokens.customer);

    const response = await request.get(toolshopEndpoints.users, {
      headers: { Authorization: `Bearer ${modifiedToken}` },
    });
    expect(response.status()).toBe(401);
    expect(await response.json()).not.toHaveProperty('data');
  });


  test('A customer cannot delete another user', async ({ request }) => {
    const email = `authorization-${randomUUID()}@example.com`;
    const createResponse = await request.post(toolshopEndpoints.register, {
      data: {
        first_name: 'Authorization',
        last_name: 'Test',
        email,
        password: `Test!9a${randomUUID()}`,
        dob: '1995-01-01',
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json();
    expect(createdUser.id).toEqual(expect.any(String));
    expect(createdUser.id.length).toBeGreaterThan(0);
    const userEndpoint = toolshopEndpoints.userById(createdUser.id);
    const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };

    try {
      const deleteResponse = await request.delete(userEndpoint, {
        headers: { Authorization: `Bearer ${tokens.customer}` },
      });
      expect(deleteResponse.status()).toBe(403);

      const userResponse = await request.get(userEndpoint, { headers: adminHeaders });
      expect(userResponse.status()).toBe(200);
      const user = await userResponse.json();
      expect(user.id).toBe(createdUser.id);
      expect(user.email).toBe(email);
    } finally {
      // Only delete the account created by this test.
      const cleanupResponse = await request.delete(userEndpoint, { headers: adminHeaders });
      expect(cleanupResponse.status(), 'Admin cleanup should delete the disposable user').toBe(204);
    }
  });


  test('An admin can delete a user — positive scenario', async ({ request }) => {
    const email = `authorization-${randomUUID()}@example.com`;
    const createResponse = await request.post(toolshopEndpoints.register, {
      data: {
        first_name: 'Authorization',
        last_name: 'Test1',
        email,
        password: `Test!9a${randomUUID()}`,
        dob: '1995-01-01',
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json();
    expect(createdUser.id).toEqual(expect.any(String));
    expect(createdUser.id.length).toBeGreaterThan(0);
    const userEndpoint = toolshopEndpoints.userById(createdUser.id);
    const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };

    let deleted = false;
    try {
      const deleteResponse = await request.delete(userEndpoint, {
        headers: adminHeaders,
      });
      deleted = deleteResponse.status() === 204;
      expect(deleteResponse.status()).toBe(204);

      const userResponse = await request.get(userEndpoint, { headers: adminHeaders });
      expect(userResponse.status()).toBe(404);
      const user = await userResponse.json();
      expect(user.id).toBeUndefined();
      expect(user.email).toBeUndefined();
    } finally {
      if (!deleted) {
        const cleanupResponse = await request.delete(userEndpoint, { headers: adminHeaders });
        expect(cleanupResponse.status(), 'Admin cleanup should delete the disposable user').toBe(204);
      }
    }
  });

  test('A customer cannot access the sales report', async ({ request }) => {
  
    const response = await request.get(toolshopEndpoints.salesReport, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    expect(response.status()).toBe(403);  

  });

  test('An admin can access the sales report', async ({ request }) => {
  
    const response = await request.get(toolshopEndpoints.salesReport, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    expect(response.status()).toBe(200);  
    const responseBody = await response.json();
    expect(Array.isArray(responseBody)).toBe(true);
    for (const entry of responseBody) {
      expect(entry.billing_country).toEqual(expect.any(String));
      expect(entry).toHaveProperty('total_sales');
      expect(String(entry.total_sales)).toMatch(/^\d+(\.\d+)?$/);
    }

  });
  test("A customer cannot access sales reports by adding an admin role parameter @negative",async({request})=>{

    const response = await request.get(toolshopEndpoints.salesReport, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
      params: { role: 'admin' },
    });
    expect(response.status()).toBe(403);

  });

  test("A customer cannot gain admin access through a custom role header @negative",async({request})=>{
    const response = await request.get(toolshopEndpoints.salesReport, {
      headers: { Authorization: `Bearer ${tokens.customer}`, 'X-Role': 'admin' },
    });
    expect(response.status()).toBe(403);
  });

  test("A customer cannot access a paginated user list @negative", async ({ request }) => {
  
    const response = await request.get(toolshopEndpoints.users, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
      params: { page: 2, limit: 10 },
    });
    expect(response.status()).toBe(403);
  });

  test('A customer cannot promote themselves to admin @negative', async ({ request }) => {
    const email = `authorization-${randomUUID()}@example.com`;
    const password = `Test!9a${randomUUID()}`;
    const createResponse = await request.post(toolshopEndpoints.register, {
      data: {
        first_name: 'Authorization',
        last_name: 'Test',
        email,
        password,
        dob: '1995-01-01',
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json();
    expect(createdUser.id).toEqual(expect.any(String));
    expect(createdUser.id.length).toBeGreaterThan(0);
    const userEndpoint = toolshopEndpoints.userById(createdUser.id);
    const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };

    try {
      const loginResponse = await request.post(toolshopEndpoints.login, {
        data: { email, password },
      });
      expect(loginResponse.status()).toBe(200);
      const loginBody = await loginResponse.json();
      expect(loginBody.access_token).toEqual(expect.any(String));
      expect(loginBody.access_token.length).toBeGreaterThan(0);
      const customerHeaders = { Authorization: `Bearer ${loginBody.access_token}` };

      const initialProfile = await request.get(userEndpoint, { headers: adminHeaders });
      expect(initialProfile.status()).toBe(200);
      expect(await initialProfile.json()).toMatchObject({ id: createdUser.id, email, role: 'user' });

      const updateResponse = await request.patch(userEndpoint, {
        headers: customerHeaders,
        data: { role: 'admin' },
      });
      // Toolshop accepts profile updates and excludes role from validated fields.
      expect(updateResponse.status()).toBe(200);

      const profileResponse = await request.get(userEndpoint, { headers: adminHeaders });
      expect(profileResponse.status()).toBe(200);
      expect(await profileResponse.json()).toMatchObject({ id: createdUser.id, email, role: 'user' });

      const freshLoginResponse = await request.post(toolshopEndpoints.login, {
        data: { email, password },
      });
      expect(freshLoginResponse.status()).toBe(200);
      const freshLogin = await freshLoginResponse.json();
      expect(freshLogin.access_token).toEqual(expect.any(String));
      expect(freshLogin.access_token.length).toBeGreaterThan(0);
      const freshHeaders = { Authorization: `Bearer ${freshLogin.access_token}` };

      const currentUserResponse = await request.get(toolshopEndpoints.currentUser, {
        headers: freshHeaders,
      });
      expect(currentUserResponse.status()).toBe(200);
      expect(await currentUserResponse.json()).toMatchObject({ id: createdUser.id, email });

      const usersResponse = await request.get(toolshopEndpoints.users, { headers: freshHeaders });
      expect(usersResponse.status()).toBe(403);
      expect(await usersResponse.json()).not.toHaveProperty('data');
    } finally {
      const cleanupResponse = await request.delete(userEndpoint, { headers: adminHeaders });
      expect(cleanupResponse.status(), 'Admin cleanup should delete the disposable user').toBe(204);
    }
  });


  test("A customer cannot update another customer's profile @negative", async ({ request }) => {
    const customers = [
      { first_name: 'CustomerA', email: `authorization-${randomUUID()}@example.com`, password: `Test!9a${randomUUID()}`, id: '' },
      { first_name: 'CustomerB', email: `authorization-${randomUUID()}@example.com`, password: `Test!9a${randomUUID()}`, id: '' },
    ];
    const [customerA, customerB] = customers;
    const createdUserIds: string[] = [];
    const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };

    try {
      for (const customer of customers) {
        const createResponse = await request.post(toolshopEndpoints.register, {
          data: {
            first_name: customer.first_name,
            last_name: 'Test',
            email: customer.email,
            password: customer.password,
            dob: '1995-01-01',
          },
        });
        expect(createResponse.status()).toBe(201);
        const createdUser = await createResponse.json();
        expect(createdUser.id).toEqual(expect.any(String));
        expect(createdUser.id.length).toBeGreaterThan(0);
        customer.id = createdUser.id;
        createdUserIds.push(createdUser.id);
      }
      expect(customerA.id).not.toBe(customerB.id);

      const loginResponse = await request.post(toolshopEndpoints.login, {
        data: { email: customerA.email, password: customerA.password },
      });
      expect(loginResponse.status()).toBe(200);
      const loginBody = await loginResponse.json();
      expect(loginBody.access_token).toEqual(expect.any(String));
      expect(loginBody.access_token.length).toBeGreaterThan(0);
      const customerAHeaders = { Authorization: `Bearer ${loginBody.access_token}` };

      const currentUserResponse = await request.get(toolshopEndpoints.currentUser, {
        headers: customerAHeaders,
      });
      expect(currentUserResponse.status()).toBe(200);
      expect(await currentUserResponse.json()).toMatchObject({ id: customerA.id, email: customerA.email });

      const customerBEndpoint = toolshopEndpoints.userById(customerB.id);
      const updateResponse = await request.patch(customerBEndpoint, {
        headers: customerAHeaders,
        data: { first_name: 'Hacker' },
      });
      expect.soft(updateResponse.status(), 'Customer A must not update customer B').toBe(403);

      const profileResponse = await request.get(customerBEndpoint, { headers: adminHeaders });
      expect(profileResponse.status()).toBe(200);
      expect(await profileResponse.json()).toMatchObject({
        id: customerB.id,
        email: customerB.email,
        first_name: customerB.first_name,
      });
    } finally {
      for (const id of createdUserIds) {
        const cleanupResponse = await request.delete(toolshopEndpoints.userById(id), {
          headers: adminHeaders,
        });
        expect.soft(cleanupResponse.status(), `Admin cleanup for ${id}`).toBe(204);
      }
    }
  });
});
