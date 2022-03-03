import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';


export default Helper.extend({
  ethereum: service(),

  compute([value, network]/*, hash*/) {
    // debugger
    var price = this.get(network+ '-prices');
    if (price)
      return '$' + Math.floor(price * value).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

    // debugger
    this.get('ethereum').getCurrencyPriceFor(network).then((computedPrice) => {
      this.set(network + '-prices', computedPrice);
      this.recompute();
    });
    // debugger
    return '';
  }
});
