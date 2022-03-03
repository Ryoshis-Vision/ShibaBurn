import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default EmberComponent.extend({
  ethereum: service(),

  ownershipPercent: computed('ethereum.totalBurnt', 'ethereum.userBurnt', function() {
    if (this.get('ethereum.totalBurnt') == 0) return 0;
    return (100 * this.get('ethereum.userBurnt') / this.get('ethereum.totalBurnt')).toFixed(2);
  }),

  actions: {
  }
});

