import EmberComponent from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import MerkleTree from 'merkletreejs';
import keccak256 from 'keccak256';
import { ethers } from "ethers"; // Ethers
import { Buffer } from 'buffer';
import fetch from 'fetch';


export default EmberComponent.extend({
  ethereum: service(),

  didInsertElement() {
    this.fetchConfig();
  },

  fetchConfig() {
    return fetch('/rewards.json').then((response) => {
      response.json().then((json) => {
        return this.set('config', json);
      });
    });
  },

  claims: computed('config', function() {
    return this.get('config')?.claims;
  }),

  claimable: computed('address', 'config', 'claims', function() {
    if (this.get('config') == null) return 0;

    var address = this.get('address');
    var amount = Number(this.get('claims')[address]?.amount || 0);
    return Math.floor((amount * 100 / Math.pow(10, 18))) / 100;
  }),

  address: computed('ethereum.currentAddress', function() {
    return ethers.utils.getAddress(this.get('ethereum.currentAddress'));
  }),

  actions: {

    claim() {
      var address = this.get('address');
      var data = this.get('claims')[address];
      var amount = data.amount;
      var proof = data.proof;
      var index = data.index;

      var contractCall = this.get('ethereum.rewarder').methods.claim(index, address, amount, proof);

      contractCall.estimateGas({
        from: this.get('ethereum.currentAddress')
      }).then((gas) => {

        return window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            gas: '0x' + Number.parseInt(gas).toString(16),
            to: this.get('ethereum.rewarderAddress'),
            from: this.get('ethereum.currentAddress'),
            data: contractCall.encodeABI(),
            value: '0x0',
          }],
        }).then((transactionHash) => {
        }).catch((error) => {
          this.set('contractError', error);
        });
      }).then((success) => {
      });
    }
  }
});

