import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class BscRoute extends Route {
  @service ethereum;

  afterModel() {
    this.get('ethereum').setNetwork('bsc');
  }
}


