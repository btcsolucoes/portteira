import { z } from 'zod';

// EXPO_PUBLIC_* values are public. Only mock is accepted until a real API is implemented.
const schema = z.object({ dataMode: z.literal('mock').default('mock') });
export const env = schema.parse({ dataMode: process.env.EXPO_PUBLIC_DATA_MODE });
