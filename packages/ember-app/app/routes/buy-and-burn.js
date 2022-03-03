import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  ethereum: service(),

  afterModel(params) {
    var tokens = {
      shib: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
      ryoshi: '0x777e2ae845272a2f540ebf6a3d03734a5a8f618e',
    }, token = tokens[params.token] || params.token.toLowerCase();

    if (tokens.shib == token) {
      this.get('ethereum').set('tokenSymbol', 'SHIB');
      this.get('ethereum').set('tokenName', 'Shiba Inu');
    }

    this.get('ethereum').set('tokenAddress', token);
    this.get('ethereum').setData();
  }
});





