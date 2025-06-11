import path from 'node:path';
import {build} from '@lionrockjs/start';
const __dirname = path.dirname(import.meta.url).replace("file://", "");

build(__dirname, '/..', 'queue', 'queue', '', true);