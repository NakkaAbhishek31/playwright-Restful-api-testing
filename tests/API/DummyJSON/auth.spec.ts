import { test, expect } from '@playwright/test';
import { dummyJsonEndpoints } from '../../../config/dummyjson.endpoints';

test.describe('DummyJSON authenticated requests', () => {
  // Keep this group in one worker so the tests share the main login.
  test.describe.configure({ mode: 'default' });

  let loginBody: { accessToken: string; refreshToken: string; username: string };

  test.beforeAll(async ({ playwright, baseURL }) => {
    const loginRequest = await playwright.request.newContext({ baseURL });
    try {
      const response = await loginRequest.post(dummyJsonEndpoints.auth, {
        data: {
          username: process.env.DUMMYJSON_USERNAME,
          password: process.env.DUMMYJSON_PASSWORD,
        },
      });
      expect(response.status()).toBe(200);
      loginBody = await response.json();
      expect(loginBody.accessToken).toEqual(expect.any(String));
      expect(loginBody.accessToken.length).toBeGreaterThan(0);
    } finally {
      await loginRequest.dispose();
    }
  });

  test('Valid credentials return access and refresh tokens', async () => {
    expect(loginBody.username).toBe(process.env.DUMMYJSON_USERNAME);
    expect(loginBody.accessToken).toEqual(expect.any(String));
    expect(loginBody.accessToken.length).toBeGreaterThan(0);
    expect(loginBody.refreshToken).toEqual(expect.any(String));
    expect(loginBody.refreshToken.length).toBeGreaterThan(0);
  });


  //Authorization
  test('A valid access token allows access to protected products', async ({ request }) => {
    // This test context has no login cookies; it authenticates with the shared token.
    const response = await request.get(dummyJsonEndpoints.authorizedProducts, {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
      params: { limit: 5 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.products).toHaveLength(5);
    for (const product of body.products) {
      expect(product.id).toEqual(expect.any(Number));
      expect(product.title).toEqual(expect.any(String));
    }
  });

  test('An invalid Bearer token cannot access protected products', async ({ request }) => {
    const response = await request.get(dummyJsonEndpoints.authorizedProducts, {
      headers: { Authorization: 'Bearer fake-token-123' },
    });
    expect(response.status()).toBe(401);
  });


    test('A modified access token cannot access protected products', async ({ request }) => {
    const response = await request.get(dummyJsonEndpoints.authorizedProducts, {
      headers: { Authorization: `Bearer ${loginBody.accessToken}modified` },
    });
    expect(response.status()).toBe(500);
  });


 test('A request without a Bearer token cannot access protected products', async ({ request }) => {
    const response = await request.get(dummyJsonEndpoints.authorizedProducts);
    expect(response.status()).toBe(401);
  });


  test('An expired access token cannot access protected products', async ({ request, playwright, baseURL }) => {
    test.setTimeout(90_000);

    // Use a separate login so the shared token remains valid for other tests.
    const loginRequest = await playwright.request.newContext({ baseURL });
    let expiringToken: string;
    try {
      const loginResponse = await loginRequest.post(dummyJsonEndpoints.auth, {
        data: {
          username: process.env.DUMMYJSON_USERNAME,
          password: process.env.DUMMYJSON_PASSWORD,
          expiresInMins: 1,
        },
      });
      expect(loginResponse.status()).toBe(200);
      const body = await loginResponse.json();
      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.accessToken.length).toBeGreaterThan(0);
      expiringToken = body.accessToken;
    } finally {
      await loginRequest.dispose();
    }

    const headers = { Authorization: `Bearer ${expiringToken}` };
    const validResponse = await request.get(dummyJsonEndpoints.authorizedProducts, { headers });
    expect(validResponse.status()).toBe(200);

    // Wait beyond the one-minute lifetime before reusing the exact same token.
    await new Promise(resolve => setTimeout(resolve, 65_000));

    const response = await request.get(dummyJsonEndpoints.authorizedProducts, { headers });
    expect(response.status()).toBe(401);
    expect(await response.json()).not.toHaveProperty('products');
  });

test('A valid refresh token returns a working access token', async ({ request, playwright, baseURL }) => {
  const refreshResponse = await request.post(
    dummyJsonEndpoints.refreshToken,
    {
      data: {
        refreshToken: loginBody.refreshToken,
      },
    }
  );

  expect(refreshResponse.status()).toBe(200);

  const refreshBody = await refreshResponse.json();
  expect(refreshBody.accessToken).toEqual(expect.any(String));
  expect(refreshBody.accessToken.length).toBeGreaterThan(0);
  expect(refreshBody.refreshToken).toEqual(expect.any(String));
  expect(refreshBody.refreshToken.length).toBeGreaterThan(0);

  // Exclude cookies set by /auth/refresh to verify the Bearer token itself.
  const tokenRequest = await playwright.request.newContext({ baseURL });
  try {
  const response = await tokenRequest.get(
    dummyJsonEndpoints.authorizedProducts,
    {
      headers: {
        Authorization: `Bearer ${refreshBody.accessToken}`,
      },
      params: {
        limit: 3,
      },
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.products).toHaveLength(3);
  } finally {
    await tokenRequest.dispose();
  }
});




});