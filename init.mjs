import { Central } from '@lionrockjs/central';

await Central.initConfig(new Map([
  ['queue', await import('./config/queue.mjs')],
]));