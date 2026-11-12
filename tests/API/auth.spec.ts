import { test, expect } from '@playwright/test';
import { endpoints } from '../../config/endpoints';

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
    data: {
      username: 'invalid-user',
      password: 'invalid-password',
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.reason).toBe('Bad credentials');
  expect(body.token).toBeUndefined();
});