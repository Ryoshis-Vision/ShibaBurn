import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default EmberComponent.extend({
  ethereum: service(),
  router: service(),

  showHome: computed('router.currentRouteName', function() {
    return this.get('router.currentRouteName') != 'index';
  }),

  actions: {
    setNetwork(network) {
      this.get('ethereum').setNetwork(network);
    },

    toggleMenu() {
      this.set('menuExpanded', !this.get('menuExpanded'));
    }
  }
});

