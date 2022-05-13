import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default EmberComponent.extend({
  ethereum: service(),

  didInsertElement() {
  },

  // burnPercent: 55,

  readableAmountToBurn: computed('', function() {
  }),

  amountToBurn: computed('ethereum.visibleEthBurnAmount', function() {
    return this.get('ethereum.visibleEthBurnAmount')?.toFixed(4)?.replace(/\.?0+$/, '');
  }),

  // burnAllowed: computed('ethereum.burnAllowance', 'ethereum.amountToBurn', function() {
  //   return this.get('ethereum.burnAllowance') >= this.get('ethereum.visibleEthBurnAmount');
  // }),


  onValueChange: computed('ethereum.userEthBalance', 'amountToBurn', function() {
    this.set('ethereum.ethToBurn', Number.parseFloat(this.get('amountToBurn')));
    var percent = 100 * this.get('ethereum.ethToBurn') / this.get('ethereum.userEthBalance');
    if (this.get('ethereum.ethToBurn') && this.get('ethereum.userEthBalance'))
      this.set('burnPercent', Math.floor(percent));
  }),

  actions: {

    onPercentChange(percent) {
      this.set('ethereum.ethToBurn', this.get('ethereum.userEthBalance') * percent / 100);
      this.set('amountToBurn', this.get('ethereum.ethToBurn'));
      this.set('burnPercent', percent);
    },

    approve() {
      this.get('ethereum').approveBurn(this.get('ethereum.visibleEthBurnAmount'));
    },

    burn() {
      this.get('ethereum').buyAndBurn();
    },

  }
});

