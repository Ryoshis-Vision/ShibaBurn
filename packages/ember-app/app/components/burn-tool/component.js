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

  sliderOptions: {
    type: 'sleek',
    range: {
      min: 0,
      max: 100
    }
  },

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

  moveSliderToPercentage(percentage, animate) {
    var SLIDER_HANDLE = this.element.querySelector('.slider-handle');
    var SLIDER_COLOR_FILLER = this.element.querySelector('.slider-color-filler');
    var SLIDER_COLOR_FILLER_CLOSED = this.element.querySelector('.slider-color-filler-closed');
    var min = 0;
    var max = 100;

    this.set('animate', !!animate);

    let difference  = max - min;
     // Make sure the percentage value stays within its boundaries
    if (percentage <= 0) {
      percentage = 0;
    } else if (percentage >= 100) {
      percentage = 100;
    }

    // Update the value based on the percentage
    let newValue = Math.round(min + (percentage * difference) / 100);
    this.set('value', newValue);

    // Store percentage for easy usage
    this.set('_percentage', percentage);
    // Move the handle to the corresponding percentage
    let percentageString = percentage + '%';
    SLIDER_HANDLE.style.left = percentageString;
    SLIDER_COLOR_FILLER.style.width = percentageString;
    SLIDER_COLOR_FILLER_CLOSED.style.width = percentageString;
    SLIDER_HANDLE.querySelector('.value-mover').innerText = percentage;
  },

  onValueChange: computed('ethereum.userTokenBalance', 'ethereum.amountToBurn', function() {
    this.set('ethereum.amountToBurn', this.get('ethereum.visibleBurnAmount'));
    var percent = 100 * this.get('ethereum.amountToBurn') / this.get('ethereum.userTokenBalance');
    if (this.get('ethereum.amountToBurn') && this.get('ethereum.userTokenBalance'))
      if (this.get('burnPercent') != percent) {
        this.set('burnPercent', Math.floor(percent));
        this.moveSliderToPercentage(this.get('burnPercent'), true);
      }
  }),

  actions: {
    // this.set('SLIDER_PATH', this.element.querySelector('.slider-path'));

    onPercentChange(percent) {
      this.set('ethereum.amountToBurn', this.get('ethereum.userTokenBalance') * percent / 100);
      this.set('burnPercent', percent);
      this.moveSliderToPercentage(percent, true);
    },

    approve() {
      this.get('ethereum').approveBurn(this.get('ethereum.visibleBurnAmount'));
    },

    burn() {
      this.get('ethereum').burn(this.get('ethereum.amountToBurn'));
    },

  }
});

