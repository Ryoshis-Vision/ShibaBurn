import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default EmberComponent.extend({
  ethereum: service(),
  classNames: ['flex-center flex-column'],

  didRender() {
    setTimeout(() => {
      this.set('flipped', !this.get('flipped'));
    }, 5000);
    this.element.querySelectorAll('.unit').forEach((unit) => {
      unit.previousElementSibling.style.paddingRight = unit.clientWidth + 13 + "px";
    });
  },

  actions: {
    setNetwork(network) {
      this.get('ethereum').setNetwork(network);
    },
  }

});




