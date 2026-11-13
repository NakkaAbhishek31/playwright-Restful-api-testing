import { test, expect } from '@playwright/test';
import { endpoints } from '../../config/endpoints';
import { invalidCredentials } from '../../test-data/auth.data';

test('Valid credentials return an authentication token', async ({ request }) => {
  const response = await request.post(endpoints.auth, {
    data: {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.token).toEqual(expect.any(String));
  expect(body.token.length).toBeGreaterThan(0);
});

test('Invalid credentials return an authentication failure', async ({ request }) => {
  const response = await request.post(endpoints.auth, {
    data: invalidCredentials,
  });

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.reason).toBe('Bad credentials');
  expect(body.token).toBeUndefined();
});