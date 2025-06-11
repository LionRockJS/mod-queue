import { Central, ORM, ControllerMixinDatabase } from '@lionrockjs/central';
import ModelQueue from './model/Queue.mjs';

export default class Queue {
  /**
   *
   * @returns {ControllerQueue}
   * @constructor
   */
  static Instance() {
    this.ins = this.ins || new Queue({});
    return Queue.ins;
  }

  #onQueueCallbacks = new Map();

  #onLoopCallbacks = new Map();

  constructor() {
    const databasePath = Central.config.queue.databasePath || (`${Central.EXE_PATH}/../database`);

    this.state = new Map();
    ControllerMixinDatabase.init(this.state);
    this.state.get(ControllerMixinDatabase.DATABASE_MAP)
      .set('queue', `${databasePath}/queue.sqlite`);
    ControllerMixinDatabase.setup(this.state).then(() => {});

    setInterval(() => {
      this.loop().then().catch(e => console.log(e));
    }, 60000);

    this.concurrent = Central.config.queue.concurrent || 10;
    this.interval = Central.config.queue.interval || 5000;
  }

  async loop() {
    // skip loop if run too frequent.
    const now = Date.now();
    if ((now - this.lastExecuteAt) < (this.interval * 0.8)) return;
    this.lastExecuteAt = now;

    await this.loopQueue();
    // loop callback
    await Promise.all(Array.from(this.#onLoopCallbacks.values()).map(async it => it(this)));
  }

  async loopQueue() {
    // check queues
    const database = this.state.get(ControllerMixinDatabase.DATABASES).get('queue');

    const processing_items = await ORM.readBy(Queue, 'queue_state_id', ['2'], { database, limit: this.concurrent, asArray: true });
    // skip if queue is full.
    if (processing_items.length === this.concurrent) return;

    const pending_items = await ORM.readBy(Queue, 'queue_state_id', ['1'], { database, limit: this.concurrent - processing_items.length, asArray: true });

    // queue is empty, clear high frequency interval
    if (pending_items.length === 0 && this.timeout) {
      clearInterval(this.timeout);
      this.timeout = null;
      return;
    }

    // new queue start, set high frequency interval
    if (pending_items.length > 0 && !this.timeout) {
      this.timeout = setInterval(() => { this.loop(); }, this.interval);
    }

    // execute and update queue
    await Promise.all(pending_items.map(async it => {
      try {
        await this.onQueue(it.model, it.model_id, it.action);
        // eslint-disable-next-line no-param-reassign
        it.queue_state_id = 3;
        await it.write();
      } catch (e) {
        // eslint-disable-next-line no-param-reassign
        it.queue_state_id = 4;
        await it.write();
      }
    }));
  }

  async onQueue(modelName, modelId, action) {
    await Promise.all(Array.from(this.#onQueueCallbacks.values()).map(async it => it(modelName, modelId, action)));
  }

  async add_queue(models, action) {
    const database = this.state.get(ControllerMixinDatabase.DATABASES).get('queue');

    // add the tickets to queue
    await Promise.all(
      models.map(async it => {
        const queue = ORM.create(ModelQueue, { database });
        queue.name = it.email || it.phone;
        queue.model = it.constructor.name;
        queue.model_id = it.id;
        queue.action = action;
        await queue.write();
      }),
    );
  }

  addListener(key, client) {
    this.#onLoopCallbacks.set(key, async loop => client.onLoop(loop));
    this.#onQueueCallbacks.set(key, async (model, modelId, action) => client.onQueue(model, modelId, action));

    return this;
  }
}
