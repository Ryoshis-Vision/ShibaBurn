import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default EmberComponent.extend({
  classNameBindings: ['isOpen:open', 'showGear:with-gear'],

  didRender() {
    var content = this.element.querySelector('.content');
    if (this.get('isOpen')) {
      if (content.getBoundingClientRect().width > window.innerWidth)
        content.style.width = window.innerWidth + 'px';
      if (content.getBoundingClientRect().right > window.innerWidth)
        content.style.left = window.innerWidth - content.getBoundingClientRect().right - 5 + "px";
    } else {
        // content.style.width = "initial";
        content.style.left = "0px";
    }
  },

  actions: {
    toggleVisibility(event) {
      debugger
      this.set('isOpen', !this.get('isOpen'));
    }
  }
});




