import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  ethereum: service(),

  model(params) {
    var token = {
      shib: this.get('ethereum.shibAddress'),
      ryoshi: '0x777E2ae845272a2F540ebf6a3D03734A5a8f618e',
    }[params.token] || params.token;

    this.get('ethereum').set('tokenAddress', token);
    this.get('ethereum').setData();
  }
});



