
export const endpoints = {
  health: '/ping',
  auth: '/auth',
  bookings: '/booking',
  bookingById: (id: number) => `/booking/${id}`,
} as const;