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

  amountToBurn: computed('ethereum.amountToBurn', function() {
    return this.get('ethereum.amountToBurn').toFixed(4).replace(/\.0+$/, '');
  }),

  burnAllowed: computed('ethereum.burnAllowance', 'ethereum.amountToBurn', function() {
    return this.get('burnValid') &&
      this.get('ethereum.burnAllowance') >= this.get('ethereum.visibleBurnAmount');
  }),

  burnValid: computed('ethereum.amountToBurn', function() {
    return this.get('ethereum.visibleBurnAmount') > 0;
  }),

  onValueChange: computed('ethereum.userTokenBalance', 'ethereum.amountToBurn', function() {
    this.set('ethereum.amountToBurn', this.get('ethereum.visibleBurnAmount'));
    var percent = 100 * this.get('ethereum.amountToBurn') / this.get('ethereum.userTokenBalance');
    if (this.get('ethereum.amountToBurn') && this.get('ethereum.userTokenBalance'))
      if (this.get('burnPercent') != percent) {
        this.set('burnPercent', Math.floor(percent));
      }
  }),

  actions: {
    onPercentChange(percent) {
      this.set('ethereum.amountToBurn', this.get('ethereum.userTokenBalance') * percent / 100);
      this.set('burnPercent', percent);
    },

    approve() {
      this.get('ethereum').approveBurn(this.get('ethereum.visibleBurnAmount'));
    },

    burn() {
      this.get('ethereum').burn(this.get('ethereum.amountToBurn'));
    },

  }
});

