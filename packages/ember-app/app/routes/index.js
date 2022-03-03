import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {
  @service ethereum;

  afterModel() {
    setTimeout(() => {
      this.get('ethereum').set('tokenSymbol', this.get('ethereum.shibSymbol'));
      this.get('ethereum').set('tokenName', 'Shiba Inu');
      this.get('ethereum').set('tokenAddress', this.get('ethereum.shibAddress'));
      this.get('ethereum').setData();
    }, 1000);
  }


}
