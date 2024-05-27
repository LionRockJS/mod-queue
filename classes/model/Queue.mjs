import {Model} from '@lionrockjs/central';

export default class Queue extends Model{
  queue_state_id = 1;
  name = null;
  model = null;
  model_id = null;
  action = null;

  static joinTablePrefix = 'queue';
  static tableName = 'queues';

  static fields = new Map([
    ["name", "String"],
    ["model", "String"],
    ["model_id", "Int"],
    ["action", "String"]
  ]);
  static belongsTo = new Map([
    ["queue_state_id", "QueueState"]
  ]);
}