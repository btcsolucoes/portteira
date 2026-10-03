import { MockHorseDataProvider, type HorseDataProvider } from '@equestre/domain';

// The screen depends on a port. Official integrations belong on the future backend.
export const horseProvider: HorseDataProvider = new MockHorseDataProvider();
