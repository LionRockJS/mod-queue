import {Model} from '@lionrockjs/central';

export default class QueueState extends Model{
  name = null;

  static joinTablePrefix = 'queue_state';
  static tableName = 'queue_states';

  static fields = new Map([
    ["name", "String"]
  ]);
  static hasMany = [
    ["queue_state_id", "Queue"]
  ];
}