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

  generateLeaf(address, value){
    return Buffer.from(
      // Hash in appropriate Merkle format
      ethers.utils
      .solidityKeccak256(["address", "uint256"], [address, value])
      .slice(2),
      "hex"
    );
  },


  tree: computed('config', function() {
    const merkleTree = new MerkleTree(
      // Generate leafs
      Object.entries(this.get('allUsers')).map(([address, tokens]) =>
        this.generateLeaf(
          ethers.utils.getAddress(address),
          ethers.utils.parseUnits(tokens.toString(), this.get('config').decimals).toString()
        )
      ),
      keccak256, // Hashing function
      { sortPairs: true }
    );

    return merkleTree;
  }),

  allUsers: computed('config', function() {
    return this.get('config')?.data?.users;
  }),

  claimable: computed('address', 'config', 'allUsers', function() {
    if (this.get('config') == null) return 0;

    var address = this.get('address');
    return this.get('allUsers')[address]; 
  }),

  address: computed('ethereum.currentAddress', function() {
    return ethers.utils.getAddress(this.get('ethereum.currentAddress'));
  }),

  actions: {

    claim() {
      var address = this.get('address');
      var tokens = this.get('claimable');
      var numTokens = ethers.utils.parseUnits(tokens.toString(), this.get('config').decimals).toString();
      var leaf = this.generateLeaf( address, numTokens);
      var proof = this.get('tree').getHexProof(leaf);


      var contractCall = this.get('ethereum.rewarder').methods.claim(address, numTokens, proof);

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

