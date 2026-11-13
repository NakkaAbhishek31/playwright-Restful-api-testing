export const toolshopEndpoints = {
  login: '/users/login',
  register: '/users/register',
  userById: (id: string) => `/users/${id}`,
  currentUser: '/users/me',
  users: '/users', 
  salesReport: '/reports/total-sales-per-country'
} as const;
