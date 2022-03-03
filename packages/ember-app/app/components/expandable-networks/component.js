import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default EmberComponent.extend({
  ethereum: service(),

  actions: {
    setNetwork(network) {
      this.get('ethereum').setNetwork(network);
    },

    toggleNetworksExpanded() {
      this.set('networksExpanded', !this.get('networksExpanded'));
    }
  }
});

