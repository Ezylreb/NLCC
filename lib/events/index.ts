/**
 * Events Module Index
 */

export * from './types';
export { EventBus, eventBus } from './EventBus';
export * from './handlers';

import { eventBus } from './EventBus';
import { registerDefaultHandlers } from './handlers';

// Auto-register default handlers on module load
registerDefaultHandlers(eventBus);

export default eventBus;
