import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';


export default Helper.extend({
  ethereum: service(),

  compute([tx, network]/*, hash*/) {
    var host = this.get('ethereum').explorerHostFor(network);


    // debugger
    return `https://${host}/tx/${tx}`;
  }
});

