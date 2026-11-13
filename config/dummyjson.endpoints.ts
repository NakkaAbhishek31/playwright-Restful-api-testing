export const dummyJsonEndpoints = {
  auth: '/auth/login',
  authorizedProducts: '/auth/products',
  products: '/products',
  refreshToken: '/auth/refresh',
  productById: (id: number) => `/products/${id}`,
} as const;
