import BN from 'bn';
import fetch from 'fetch';
import Service from '@ember/service';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Service.extend({
  name: 'lpCalculator',
  ethereum: service(),

  async calculateLPPrice() {
    var contractMethods = this.get('ethereum.contract').methods;
    const lpTotalSupply = await this.get('ethereum.lpPairContract').methods.totalSupply().call();
    var oneWei = new BN.BigInteger((10**18).toString())

    var pairAddress = this.get('ethereum.lpPairAddress');
    var tokenReserves = await contractMethods.balanceOf(pairAddress).call();
    var tokensPerLP = BN.BigInteger(tokenReserves)
      .multiply(oneWei).divide(new BN.BigInteger(lpTotalSupply));

    var tokensPerEth = await contractMethods.getEstimatedTokensInForETH(1).call();
    var tokenEthPerLP = tokensPerLP.divide(new BN.BigInteger(tokensPerEth))


    var ethReserves = await this.get('ethereum.wethContract').methods.balanceOf(pairAddress).call();
    var ethPerLP = (new BN.BigInteger(ethReserves))
      .multiply(oneWei).divide(new BN.BigInteger(lpTotalSupply));

    var pricePerEth = await this.get('ethereum').getCurrencyPrice();

    return (tokenEthPerLP.add(ethPerLP) / 10**18) * pricePerEth;
  },


});
