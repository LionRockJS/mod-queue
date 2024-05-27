import url from "node:url";
const dirname = url.fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');
export default {dirname}

import Queue from './classes/QueueLoop.mjs';

export{
  Queue,
}

