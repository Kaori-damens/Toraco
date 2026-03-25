// Centralized constants for arena sizes and shrinking timings
export const ARENA_SIZES = {
  TINY:   { w: 300,  h: 300  },
  SMALL:  { w: 380,  h: 380  },
  MEDIUM: { w: 520,  h: 520  },
  LARGE:  { w: 660,  h: 660  },
  HUGE:   { w: 1100, h: 1100 }
};

// Timings (faster per user request)
export const HOLD_MS = 8000;      // was 30000
export const TRANSITION_MS = 2000; // was 5000