import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default EmberComponent.extend({
  ethereum: service(),
  classNameBindings: ["clickable:pointer", "ethereum.wrongNetwork:wrong-network"],

  didInsertElement() {
  },

  clickable: computed('ethereum.needsWallet', 'ethereum.currentAddress', function() {
    return this.get('ethereum.needsWallet') || !this.get('ethereum.currentAddress');
  }),

  walletText: computed('ethereum.wrongNetwork', 'ethereum.currentAddress', function() {
    if (this.get('ethereum.wrongNetwork'))
      return 'WRONG NETWORK';
    return this.get('ethereum.currentAddress')?.replace(/^..(.{7})(.+)$/, '0x$1...') ||
      "Connect Wallet";
  }),

  tokenBalance: computed('ethereum.tokenBalance', function() {
    return this.get('ethereum.tokenBalance').toString().replace(/\.?0+$/,'');
  }),

  hasTokens: computed.gt('ethereum.tokenBalance', 0),
  hasEth: computed.gt('ethereum.currentWalletBalance', 0),
  showEth: computed.and('ethereum.currentAddress', 'hasEth'),

  actions: {
    click() {
      if (this.get('ethereum.wrongNetwork'))
        this.get('ethereum').switchToEthNetwork();
      else this.get('ethereum').connectWallet();
    }
  }

});




