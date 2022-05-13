import Service from '@ember/service';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Service.extend({
  name: 'ethereum',
  lpCalculator: service(),


  //////////////////////
  //
  // Highly recommend using
  // hardhat fork. Forking the
  // mainnet is the best way to
  // develop on the blockchain.
  //
  //////////////////////
  useLocalFork: false,

  initalBurnPercentage: 25,

  isBurningShib: computed('tokenAddress', 'shibAddress', function() {
    return this.get('tokenAddress') == this.get('shibAddress');
  }),

  visibleEthBurnAmount: computed('userEthBalance', 'ethToBurn', function() {
    if (this.get('userEthBalance') == undefined) return;
    if (this.get('ethToBurn') != undefined) return this.get('ethToBurn');

    return this.get('userEthBalance') * this.get('initalBurnPercentage') / 100;
  }),

  getMinTokensOut() {
    return this.get('shibaSwapRouter').methods.getAmountsOut(BigInt(this.get('visibleEthBurnAmount') * 10**18), [
      this.get('wethAddress'), this.get('tokenAddress')
    ]).call().then((tokensPerEth) => {
      return tokensPerEth[1] * ((100 - this.get('visibleSlippage')) / 100);
    }).catch((e) => {
    });
  },

  visibleSlippage: computed('slippage', function() {
    return this.get('slippage') || 3;
  }),

  buyAndBurnWeeklyReturnUSD: computed('visibleEthBurnAmount', 'remainingRewardRyoshis', 'tokensPerUSD', 'updaterKey', function() {
    if ((this.get('visibleEthBurnAmount') || 0) == 0) return 0;

    var tokensPerEth = this.get('tokensPerUSD') * this.get('usdPerEth');
    var visibleEthBurnAmount = Number.parseFloat(this.get('visibleEthBurnAmount'));
    var burnPercentage = visibleEthBurnAmount / ((this.get('totalBurnt')/tokensPerEth) + visibleEthBurnAmount);
    var usdPerWeek = 0;

    this.get('rewardDetails').forEach((rewardDetails) => {
      if (rewardDetails.remainingDistributions > 0)
        usdPerWeek += rewardDetails.rewardsPerWeekInUSD || 0;
    });

    return Math.floor(100 * (burnPercentage * usdPerWeek))/ 100;
  }),

  visibleBurnAmount: computed('userTokenBalance', 'amountToBurn', function() {
    if (this.get('userTokenBalance') == undefined) return;
    if (this.get('amountToBurn') != undefined) return this.get('amountToBurn');

    return this.get('userTokenBalance') * this.get('initalBurnPercentage') / 100;
  }),

  weeklyReturnUSD: computed('visibleBurnAmount', 'remainingRewardRyoshis', 'usdPerEth', 'ryoshiPerEth', 'amountToBurn', function() {
    console.log("is it undefined?");
    if (this.get('visibleBurnAmount') == undefined) return 0;

    var visibleBurnAmount = Number.parseFloat(this.get('visibleBurnAmount'));
    var burnPercentage = visibleBurnAmount / (this.get('totalBurnt') + visibleBurnAmount);

      var usdPerWeek = 0;

      this.get('rewardDetails').forEach((rewardDetails) => {
        if (rewardDetails.remainingDistributions > 0)
          usdPerWeek += rewardDetails.rewardsPerWeekInUSD || 0;
      });

      console.log("For each reward....", burnPercentage, usdPerWeek);
      return Math.floor(100 * (burnPercentage * usdPerWeek))/ 100;
  }),

  burnAmountUSD: computed('visibleBurnAmount', 'tokensPerUSD', 'usdPerEth', function() {
    if (!this.get('visibleBurnAmount')) return 0;
    if (this.get('tokensPerUSD')) {
      var burnAmountInUSD = ((this.get('visibleBurnAmount')) / this.get('tokensPerUSD'));
      return burnAmountInUSD.toFixed(2); 
    } else return '';
  }),

  buyAndBurnAmountUSD: computed('visibleEthBurnAmount', 'usdPerEth', function() {
    if (!this.get('visibleEthBurnAmount')) return 0;
    if (this.get('usdPerEth')) {
      var burnAmountInEth = this.get('visibleEthBurnAmount');
      return (this.get('usdPerEth') * burnAmountInEth).toFixed(2); 
    } else return '';
  }),

  requestAccess() {
    window.ethereum.request({ method: 'eth_requestAccounts' });
  },

  connectWallet() {
    if (this.get('needsWallet'))
      window.open("https://metamask.io/download.html");
    else if (!this.get('currentAddress'))
      this.requestAccess();
  },

  provider: computed('environment', 'network', function(){
    // When using hardhat/ganache fork
    if (this.get('useLocalFork'))
      return "http://127.0.0.1:8545";

    return {
      unknown: {},
      test: {
        eth: ``, // INSERT YOUR RPC ENDPOINT KEY HERE
      },
      production: {
        eth: ``, // INSERT YOUR RPC ENDPOINT KEY HERE
      }
    }[this.get('environment') || 'production'][this.get('network') || this.get('defaultNetwork')];
  }),

  network: 'eth',

  tokenPriceUSD: computed('ethPerToken', 'usdPerEth', function() {
    if (this.get('usdPerEth') && this.get('ethPerToken'))
      return this.get('usdPerEth') * this.get('ethPerToken');
  }),

  chartUrl: computed('network', 'tokenAddress', function() {
    return {
      eth: `https://dex.guru/token/${this.get('tokenAddress')}-eth`,
    }[this.get('network')]
  }),

  swapHost: computed('environment', 'network', function() {
    return {
      eth: "shibaswap.com",
    }[this.get('network')];
  }),

  swapUrl: computed('swapHost', 'swapPath', 'tokenAddress', function() {
    return `https://${this.get('swapHost')}${this.get('swapPath')}?outputCurrency=${this.get('tokenAddress')}`;
  }),

  swapPath: computed('swapHost', function() {
    if (this.get('swapHost') == "app.sushi.com")
      return '/swap';
    else return '/#/swap';
  }),

  swapName: computed('network', function() {
    return {
      eth: "shibaswap",
    }[this.get('network')];
  }),

  explorerHost: computed('environment', 'network', function() {
    return this.explorerHostFor(this.get('environment'), this.get('network'));
  }),

  explorerHostFor(environment, network) {
    return ({
      test: {
        eth: "rinkeby.etherscan.io",
      },
      production: {
        eth: "etherscan.io",
      }
    }[environment] || {})[network];
  },

  exploreContractUrl: computed('explorerHost', 'tokenAddress', function() {
    return `https://${this.get('explorerHost')}/address/${this.get('contractAddress')}#code`;
  }),

  exploreUrl: computed('explorerHost', 'tokenAddress', function() {
    return `https://${this.get('explorerHost')}/token/${this.get('tokenAddress')}`;
  }),

  currencyScanner: computed('explorerHost', function() {
    return this.get('explorerHost').split('.').reverse()[1];
  }),

  tokenPairAddresses: computed('environment', function() {
    return {
      test: {
        eth: "",
      },
      production: {
        eth: "",
      },
    }[this.get('environment')];
	}),

  lpPairAddress: '',

  lpPairAddress: computed('environment', 'network', function() {
    return this.get('tokenPairAddresses')[this.get('network')];
  }),

  lpPairContract: computed('provider', function() {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('contractABI'), this.get('contractAddress'));
  }),

  rewarderAddress: computed('environment', 'network', function() {
    return "0xD43C2F31906140d148B18BA8f2f87c5671D0413a";
  }),

  rewarder: computed('environment', 'network', function() {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('rewarderABI'), this.get('rewarderAddress'));
  }),

  contractAddress: computed('contractAddresses', 'network', function() {
    return this.get('contractAddresses')[this.get('network')];
  }),

  contractAddresses: computed('environment', 'network', function() {
    return {
      test: {
        eth: "0xCb58a99a22991613548E7129e78651e53D214A8c",
      },
      production: {
        eth: "0x88f09b951F513fe7dA4a34B436a3273DE59F253D",
      },
    }[this.get('environment')] || {};
	}),

  contractAddress: computed('contractAddresses', 'network', function() {
    return this.get('contractAddresses')[this.get('network')];
  }),

  wethAddress: computed('environment', 'wethAddresses', function() {
    return (this.get('wethAddresses')[this.get('environment')] ||{})[this.get('network')] ||
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  }),

  wethAddresses: {
    test: {
      eth: "0xc778417e063141139fce010982780140aa0cd5ab",
    },
    production: {
      eth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    }
  },

  web3: computed('provider', function() {
    return new Web3(new Web3.providers.HttpProvider(this.get('provider')));
  }),

  unknownChain: computed('environment', function() {
    return this.get('networkForCurrentChain') == null;
    // return this.get('environment') == 'unknown' &&
    //   this.get('currentChain') != null;
  }),

  isConnecting: computed('currentChain', function() {
    return this.get('currentChain') == null;
  }),

  isLoading: computed('somePrice', function() {
    return this.get('somePrice') == null;
  }),

  shibaSwapRouter: computed('web3', function() {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('ISwapRouterABI'), '0x03f7724180aa6b939894b5ca4314783b0b36b329');
  }),

  shibAddresses: computed('environment', function() {
    return {
      production: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
      test: '0x27498D86b17D5de38ABFAc07a8477eD17859aa5c', // Mintable SHIB
    };
  }),

  shibAddress: computed('environment', 'shibAddresses', function() {
    return this.get('shibAddresses')[this.get('environment')];
  }),

  shibSymbol: computed('environment', 'shibAddresses', function() {
    return {
      test: 'mSHIB',
      production: 'SHIB',
    }[this.get('environment')];
  }),

  ryoshisVisionAddress: '0x777E2ae845272a2F540ebf6a3D03734A5a8f618e',

  // This is the address of the current xshib ryoshi reward pool:
  ryoshiRewardAddress: "0x7732674b5e5ffec4785aefdaea807eeca383b5e6",

  ryoshiBurnAddress: computed.reads('shibAddress'),

  erc20For(address) {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('ERC20ABI'), address);
  },

  ryoshisVision: computed('web3', function() {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('ERC20ABI'), this.get('ryoshisVisionAddress'));
  }),

  token: computed('web3', 'tokenAddress', function() {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('ERC20ABI'), this.get('tokenAddress'));
  }),

  contract: computed('provider', function() {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('contractABI'), this.get('contractAddress'));
  }),

  wethContract: computed('provider', function() {
    var eth = this.get('web3').eth;
    return new eth.Contract(this.get('ERC20ABI'), this.get('wethAddress'));
  }),


  ///////////////////////////
  //
  //         SETUP
  //
  ///////////////////////////

  setup() {
    if (window.ethereum?.networkVersion && this.get('networks')[window.ethereum.networkVersion]) {
      console.log("HAS NETWORK", window.ethereum.networkVersion, this.get('networks')[window.ethereum.networkVersion]);
      this.setNetwork(this.get('networks')[window.ethereum.networkVersion]);
    } else {
      console.log("HAS NO NETWORK", window.ethereum?.networkVersion, this.get('networks')[window.ethereum?.networkVersion]);
      this.setNetwork(this.get('defaultNetwork'));
    }
    this.listenForEvents();
  },

  setNetwork(network) {
    this.set('network', network);
    this.set('currentChain', this.get('chainForCurrentNetwork'));

    if (window.ethereum == null) return;
    if (window.ethereum.networkVersion == null) return;

    var networkChanged = this.get('chainForCurrentNetwork') != window.ethereum.networkVersion;
    if (networkChanged) {
      this.resetData();
      this.setData();
    }
  },

  addCurrentNetworkChain() {
    try {
      const params = [{
        chainId: '0x' + this.get('chainForCurrentNetwork').toString(16),
        chainName: this.get('readableNetworkName'),
        nativeCurrency: {
          name: this.get('currency'),
          symbol: this.get('currency'),
          decimals: 18
        },
        rpcUrls: {
          bsc: ['https://bsc-dataseed1.binance.org'],
          arbitrum: ['https://arb1.arbitrum.io/rpc'],
          matic: ['https://rpc-mainnet.maticvigil.com/'],
        }[this.get('network')],
        blockExplorerUrls: {
          bsc: ['https://bscscan.com'],
          arbitrum: ['https://arbiscan.io/'],
          matic: ['https://polygonscan.com/'],
        }[this.get('network')]
      }]

      return window.ethereum.request({ method: 'wallet_addEthereumChain', params });
    } catch (addError) {
      // handle "add" error
    }
  },

  wrongNetwork: computed('environment', 'network', function() {
    return this.get('networkForCurrentChain') != 'eth' && this.get('environment') != 'test';
  }),

  switchToEthNetwork() {
    try {
      return window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + this.chainForNetwork('eth').toString(16), }],
      }).catch((switchError) => {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          this.addCurrentNetworkChain();
        }
      });
      // handle other "switch" errors
    } catch (switchError) {
      if (switchError.code === 4902) {
        this.addCurrentNetworkChain();
      }
    }
  },

  readableNetworkName: computed('network', 'environment', function() {
    var name = this.get('network');
    name = {
      arbitrum: 'Arbitrum One',
      bsc: 'Binance Smart Chain Mainnet',
      matic: 'Polygon Network',
    }[name] || name;

    name.charAt(0).toUpperCase() + name.slice(1);
    if (this.get('environment') == 'test')
      name += " Tesetnet";
    return name;
  }),

  needsWallet: computed(() => {
    return window.ethereum == null;
  }),

  listenForEvents() {
    if (window.ethereum == null) return;
    else if (!this.get('isListening')) {
      window.ethereum.on('connect', this.setData.bind(this));
      window.ethereum.on('chainChanged', this.resetAndSetData.bind(this));
      window.ethereum.on('accountsChanged', this.resetAndSetData.bind(this));
      window.ethereum.request({ method: 'eth_accounts' }).then(this.setData.bind(this));
      setInterval(this.periodicUpdate.bind(this), 25000);
      setTimeout( this.setData.bind(this), 2000);
      this.getStaticData();
      window.onfocus = () => {
        this.set('pageUpdatesPaused', false);
        this.setData();
      };
      this.set('isListening', false);
    }
  },

  getStaticData() {
    // calling this outside of setData so it doesn't
    // get called every time we poll the blockchain
    // this.requestValueOfRewardedRyoshi();
    this.requestRyoshiRewards();
    this.requestValueOfToken();



    this.fetchRewardDetails();
  },

  periodicUpdate() {
    console.log("PERIODIC UPDATE~~~~~~~~~~~~");
    if (!this.get('pageUpdatesPaused') && !document.hidden) this.setData();
  },

  resetAndSetData() {
    this.resetData();
    this.setData();
  },

  resetData() {
    this.set('actionError', null);
    this.set('usdPerEth', null);
  },

  chainForCurrentNetwork: computed('network', function () {
    return this.chainForNetwork(this.get('network'));
  }),

  chainForNetwork: function(network) {
    return {
      eth: this.get('useLocalFork') ? 31337 : 1,
      // eth: 4,             // tesetnet
    }[network];
  },

  networkForCurrentChain: computed('currentChain', function() {
    return this.get('networks')[this.get('currentChain')];
  }),

  networks: computed(function() {
    return {
      31337: 'eth',

      1: 'eth',
      4: 'eth', //testnet
    };
  }),

  defaultNetwork: 'eth',

  tokenBalancePresent: computed('userTokenBalance', function() {
    return this.get('userTokenBalance') > 0;
  }),

  setData() {
    if (this.get('currentChain') == null || window.ethereum == null) return;
    var networkChanged = this.get('currentChain') != window.ethereum.networkVersion;
    console.log("CHAIN WAS: ", this.get('currentChain'), "New Chain:", window.ethereum.networkVersion, "Changed:", networkChanged);
    this.set('currentChain', Number.parseInt(window.ethereum.networkVersion));
    window.ethereum.request({ method: 'eth_accounts' }).then((addr) => {
      this.set('currentAddress', addr[0]?.toUpperCase().replace('X', 'x'));
    });
    if (networkChanged) this.set('network', this.get('networkForCurrentChain') || this.get('defaultNetwork'));


    var requestingWithZeroAddress = !this.get('currentAddress');

    if (this.get('tokenAddress') && this.get('contractAddress') && this.get('contract').methods.getInfo) {
      if (this.get('tokenName') == null)
        this.get('contract').methods.getTokenInfo(this.get('tokenAddress')).call().then((info) => {
          this.set('tokenName', info[0]);
          this.set('tokenSymbol', info[1]);
          this.set('fullTokenName', `${info[1]} (${info[0]})`);
        });
      this.get('contract').methods.getInfo(this.get('currentAddress') || "0x0000000000000000000000000000000000000000", this.get('tokenAddress')).call().then((info) => {

        this.set('tokenDecimals', Number.parseInt(info[0]));

        var decimals = this.get('tokenDecimals');
        var hasXToken = info[9] != '0';
        var totalBurnt = hasXToken ? info[10] : info[1];

        if (hasXToken) {
          var xTokenWas = this.get('xTokenAddress');
          this.set('xTokenAddress', '0x' + BigInt(info[9]).toString(16));
          if (xTokenWas != this.get('xTokenAddress'))
            this.get('contract').methods.getTokenInfo(this.get('xTokenAddress')).call().then((info) => {
              this.set('xTokenName', info[0]);
              this.set('xTokenSymbol', info[1]);
              this.set('fullXTokenName', `${info[1]} (${info[0]})`);
            });
        } else {
          this.set('xTokenAddress', null);
          this.set('xTokenName', null);
          this.set('xTokenSymbol', null);
        }

        this.set('totalBurnt', Math.round(100 * totalBurnt/10**decimals)/ 100);
        console.log("REQUESTING WITH ZERO ADDR?", requestingWithZeroAddress);
        if (!requestingWithZeroAddress) {
          var userBurnt = hasXToken ? info[11] : info[2];

          this.set('userDataRetrieved', true);
          this.set('userBurnt', Math.floor((userBurnt/10**decimals) * 100)/100);
          this.set('userTokenBalance', Math.floor((info[3]/10**decimals) * 10)/10);
          this.set('userEthBalance', Math.floor((info[4]/10**18) * 1000)/1000);
          this.set('burnAllowance', (info[5]/10**18));
        } else {
          this.set('userBurnt', 0);
          this.set('userEthBalance', 0);
          this.set('userTokenBalance', 0);
        }
        this.getCurrencyPrice().then((usdPerEth) => {
          this.set('usdPerEth', usdPerEth);
          this.set('userUSDBalance', usdPerEth * this.get('userTokenBalance'));
        });
      }).catch((error) => {
        console.log("Data fetch received error: ", error);
      });
    }
  },

  insufficientBalance: computed('currentWalletBalance', 'somePrice', function() {
    return this.get('currentWalletBalance') < this.get('somePrice');
  }),

  fetchedCurrencyPrices: {},


  async getCurrencyPrice(coinGeckoId) {
    coinGeckoId ||= {
      matic: "matic-network",
      arbitrum: "ethereum",
      eth: "ethereum",
      bsc: "binancecoin",
    }[this.get('network')]
    return this.getCurrencyPriceFor(coinGeckoId);
  },

  // Fetch (ETH, BNB, etc...) price from coingecko:
  async getCurrencyPriceFor(coinGeckoId) {
    var alreadyFectchedPrice = this.get('fetchedCurrencyPrices')[coinGeckoId];
    if (alreadyFectchedPrice) return alreadyFectchedPrice;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`
    )
    var json = await response.json();
    this.set(`fetchedCurrencyPrices.${coinGeckoId}`, json[coinGeckoId]['usd'])
    return json[coinGeckoId]['usd'];
  },

  currency: computed('network', function() {
    return this.currencyFor(this.get('network'));
  }),

  currencyFor(network) {
    return {
      'eth': 'ETH',
      'bsc': 'BNB',
      'matic': 'MATIC',
      'arbitrum': 'AETH',
    }[network];
  },

  daysSinceRyoshiLaunch: computed(function() {
    var today = new Date();
    var launchDate = new Date('aug 7 2021');
    var difference = today.getTime() - launchDate.getTime();
    return  Math.ceil(difference / (1000 * 3600 * 24)); 
  }),
 
  // Add more burnable addresses and coingecko IDs here:
  coinGeckoId: computed('tokenAddress', function() {
    return {
      '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce': 'shiba-inu', // shib on mainnet
    }[this.get('tokenAddress').toLowerCase()];
  }),


  // Add more reward configs here:
  allRewardConfigs: computed(function() {
    // MAKE SURE ALL KEYS ARE LOWERCASE!
    return {
      '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce': [{ // SHIB on mainnet
        rewardWalletAddress: "0x7732674b5e5ffec4785aefdaea807eeca383b5e6", // This is the address of the current xshib ryoshi reward pool:
        tokenAddress: '0x777E2ae845272a2F540ebf6a3D03734A5a8f618e',
        rewardStartDate: new Date('feb 27 2022'),
        coinGeckoId: 'ryoshis-vision',
        rewardDurationInDays: 140,
        rewardDistributions: 10,
        rewardTokendecimals: 18,
        rewardName: 'RYOSHI',
      }],
      '0x27498d86b17d5de38abfac07a8477ed17859aa5c': [{ // Mintable SHIB on Rinkeby network
        rewardWalletAddress: "0xdead000000000000000042069420694206942069", // This is the legendary dead address, it has a growing amoutn of Mintable SHIB
        tokenAddress: '0x27498d86b17d5de38abfac07a8477ed17859aa5c', // SHIBA LOVE (9 deciamls)
        rewardStartDate: new Date('dec 1 2021'),
        coinGeckoId: 'shiba-inu', // For testing purposes, using the price for shiba-inu
        rewardDurationInDays: 140,
        rewardDistributions: 10,
        rewardName: 'rmSHIB',
        rewardTokendecimals: 9,
      }]
    };
  }),

  rewardConfigs: computed('tokenAddress', 'allRewardConfigs', function() {
    return this.get("allRewardConfigs")[this.get('tokenAddress')?.toLowerCase()] || [];
  }),

  allRewardDetails: {},

  rewardDetails: computed('allRewardDetails', 'tokenAddress', function() {
    return this.get('allRewardDetails')[this.get('tokenAddress')?.toLowerCase()] || [];
  }),

  rewardsRequested: {},

  fetchRewardDetails() {
    this.requestValueOfToken();
    if (!this.get('provider') || !this.get('tokenAddress')) return;

    var tokenAddress = this.get('tokenAddress').toLowerCase();
    if (this.get('rewardsRequested')[tokenAddress]) return;
    this.get('rewardsRequested')[tokenAddress] = true;

    var now = new Date().getTime();
    var msPerDay = 1000 * 3600 * 24;

    this.get('allRewardDetails')[tokenAddress] = [];
    this.get('rewardConfigs').forEach((rewardConfig) => {
      var rewardDetails = {rewardName: rewardConfig.rewardName};
      this.get('allRewardDetails')[tokenAddress].push(rewardDetails);
      var daysPerDistribution = (rewardConfig.rewardDurationInDays / rewardConfig.rewardDistributions);

      rewardDetails.distributionsPerYear = 365 / daysPerDistribution;

      var startTime = rewardConfig.rewardStartDate.getTime();
      var endTime = startTime + (rewardConfig.rewardDurationInDays * msPerDay);
      var msRemaining = endTime - now;
      var remainingRewardDays = Math.ceil(msRemaining / msPerDay); 
      rewardDetails.remainingDistributions = Math.floor(remainingRewardDays / daysPerDistribution);
      this.erc20For(rewardConfig.tokenAddress).methods.balanceOf(rewardConfig.rewardWalletAddress).call().then((remainingTokens) => {
        var remainingRewards = (remainingTokens / (10 ** rewardConfig.rewardTokendecimals));
        var rewardsPerRemainingDistributions = remainingRewards / rewardDetails.remainingDistributions;
        var rewardsPerYear = rewardsPerRemainingDistributions * rewardDetails.distributionsPerYear

        this.getCurrencyPriceFor(rewardConfig.coinGeckoId).then((usdPerRewardToken) => {
          rewardDetails.remainingRewardsInUSD = remainingRewards * usdPerRewardToken;
          rewardDetails.rewardsPerYearInUSD = rewardsPerYear * usdPerRewardToken;
          rewardDetails.rewardsPerWeekInUSD = rewardDetails.rewardsPerYearInUSD / 52;
          rewardDetails.tokensPerUSD = 1 / usdPerRewardToken;
          this.set('updaterKey', this.get('updaterKey') + 1);
        });
      }).catch((error) => {
      });

    });
  },

  updaterKey: 0,

  totalAPR: computed('provider', 'tokenAddress', 'updaterKey', 'totalBurnt', 'tokensPerUSD', function() {
    this.fetchRewardDetails();
    if (this.get('tokensPerUSD') == null || this.get('totalBurnt') == null || this.get('rewardDetails') == []) return 0;
    else {
      var burntUSD = this.get('totalBurnt') / this.get('tokensPerUSD');

      var usdPerYear = 0;

      this.get('rewardDetails').forEach((rewardDetails) => {
        if (rewardDetails.remainingDistributions > 0)
          usdPerYear += rewardDetails.rewardsPerYearInUSD || 0;
      });

      return Math.floor(100 * (usdPerYear / burntUSD))/ 100;
    }
  }),

  async requestRyoshiRewards() {
    return this.get('ryoshisVision').methods.balanceOf(this.get('ryoshiRewardAddress')).call().then((remainingRyoshis) => {
      return this.set('remainingRewardRyoshis', remainingRyoshis);
    });
  },

  async requestValueOfToken() {
    if (this.get('tokenAddress'))
      this.getCurrencyPrice(this.get('coinGeckoId')).then((usdPerToken) => {
        this.set('tokensPerUSD', 1 / usdPerToken);
      });
  },

  // async requestValueOfRewardedRyoshi() {
  //   this.get('shibaSwapRouter').methods.getAmountsOut(BigInt(10**18), [
  //     this.get('wethAddress'), this.get('ryoshisVisionAddress')
  //   ]).call().then((tokensPerEth) => {
  //     this.get('ryoshisVision').methods.balanceOf(this.get('ryoshiBurnAddress')).call().then((burntRyoshi) => {
  //       this.getCurrencyPrice().then((usdPerEth) => {
  //         this.set('usdPerEth', usdPerEth);
  //         this.set('ryoshiPerEth', tokensPerEth[1]);
  //         this.set('rewardedRyoshi', (burntRyoshi  - 490000000000000 * (10**18)));
  //         this.set('rewardedRyoshiInETH', this.get('rewardedRyoshi') / tokensPerEth[1]);
  //         this.set('rewardedRyoshiInUSD', (this.get('rewardedRyoshiInETH') * this.get("usdPerEth")).toFixed(2));
  //       });
  //     });
  //   });
  // },

  async approveBurn(amount) {
		var input = BigInt(2**256) - 1n;

    this.get('token').methods.approve(this.get('contractAddress'), input).estimateGas({
      from: this.get("currentAddress"),
      value: 0,
    }).then((gas) => {
      const txHash = window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          gas: '0x' + Number.parseInt(gas).toString(16),
          to: this.get('tokenAddress'),
          from: this.get('currentAddress'),
          data: this.get('token').methods.approve(this.get('contractAddress'), input).encodeABI(),
          value: '0x0'
        }],
      }).then((transactionHash) => {
      }).catch((error) => {
        this.setError('contractError', error);
      });
    }).catch((error) => {
      this.setError('contractError', error);
    });
  },


  isProductionShib: computed('shibAddresses', 'tokenAddress', function() {
    return this.get('shibAddresses')['production'].toLowerCase() == this.get('tokenAddress').toLowerCase();
  }),

  async burn(amount) {
		var input = BigInt(Math.floor(10 ** 18 * amount));

    var contractMethods = this.get('contract').methods;
    var callToBurn = this.get("isProductionShib") ?
      contractMethods.burnShib(input) : contractMethods.burnToken(this.get('tokenAddress'), input);

    callToBurn.estimateGas({
      from: this.get("currentAddress"),
      value: 0,
    }).then((gas) => {
      const txHash = window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          gas: '0x' + Number.parseInt(gas).toString(16),
          to: this.get('contractAddress'),
          from: this.get('currentAddress'),
          data: callToBurn.encodeABI(),
          value: '0x0'
        }],
      }).then((transactionHash) => {
      }).catch((error) => {
        this.setError('contractError', error);
      });
    }).catch((error) => {
      this.setError('contractError', error);
    });
  },

  async buyAndBurn() {
		var input = BigInt(Math.floor(10 ** 18 * this.get('visibleEthBurnAmount')));
    this.getMinTokensOut().then((minTokensOut) => {
      if (minTokensOut == null)
        this.setError('contractError', 'Something went wrong')
      var slippedOutput = BigInt(minTokensOut);

      this.get('contract').methods.buyAndBurn(this.get('tokenAddress'), slippedOutput).estimateGas({
        from: this.get("currentAddress"),
        value: '0x' + input.toString(16),
      }).then((gas) => {
        const txHash = window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            gas: '0x' + Number.parseInt(gas).toString(16),
            to: this.get('contractAddress'),
            from: this.get('currentAddress'),
            data: this.get('contract').methods.buyAndBurn(this.get('tokenAddress'), slippedOutput).encodeABI(),
            value: '0x' + input.toString(16),
          }],
        }).then((transactionHash) => {
        }).catch((error) => {
          this.setError('contractError', error);
        });
      }).catch((error) => {
        this.setError('contractError', error);
      });
    });
  },

  setError(errorType, message) {
    console.log(errorType, message);
    message = (message.message || message).toString().replace(/^.*: /, '')
    message = message.charAt(0).toUpperCase() + message.slice(1);

    this.set(errorType, message);
    setTimeout(() => { this.set(errorType, null) }, 15000);
  },

  environment: computed('currentChain', function() {
    if ([4,97, 80001].includes(this.get('currentChain')))
      return "test";
    else if ([42161, 31337, 137, 1, 56].includes(this.get('currentChain')))
      return 'production';
    else return "unknown";
  }),

  isETH: computed('network', function() {
    return this.get('network') == 'eth';
  }),

  environmentIndicator: computed('network', 'environment', 'currentChain', function() {
    if (this.get('environment') == 'test')
      return "testnet";
  }),

  ISwapRouterABI: computed( function() {
    return [ { "inputs": [], "name": "WETH", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "pure", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint256", "name": "amountADesired", "type": "uint256" }, { "internalType": "uint256", "name": "amountBDesired", "type": "uint256" }, { "internalType": "uint256", "name": "amountAMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountBMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "addLiquidity", "outputs": [ { "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "amountB", "type": "uint256" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "addLiquidityAVAX", "outputs": [ { "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "addLiquidityETH", "outputs": [ { "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "factory", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "pure", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint256", "name": "reserveIn", "type": "uint256" }, { "internalType": "uint256", "name": "reserveOut", "type": "uint256" } ], "name": "getAmountIn", "outputs": [ { "internalType": "uint256", "name": "amountIn", "type": "uint256" } ], "stateMutability": "pure", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "reserveIn", "type": "uint256" }, { "internalType": "uint256", "name": "reserveOut", "type": "uint256" } ], "name": "getAmountOut", "outputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" } ], "stateMutability": "pure", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" } ], "name": "getAmountsIn", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" } ], "name": "getAmountsOut", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "reserveA", "type": "uint256" }, { "internalType": "uint256", "name": "reserveB", "type": "uint256" } ], "name": "quote", "outputs": [ { "internalType": "uint256", "name": "amountB", "type": "uint256" } ], "stateMutability": "pure", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountAMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountBMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "removeLiquidity", "outputs": [ { "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "amountB", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "removeLiquidityAVAX", "outputs": [ { "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bool", "name": "approveMax", "type": "bool" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "removeLiquidityAVAXWithPermit", "outputs": [ { "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "removeLiquidityETH", "outputs": [ { "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bool", "name": "approveMax", "type": "bool" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "removeLiquidityETHWithPermit", "outputs": [ { "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountAMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountBMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bool", "name": "approveMax", "type": "bool" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "removeLiquidityWithPermit", "outputs": [ { "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "amountB", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapAVAXForExactTokens", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapETHForExactTokens", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapExactAVAXForTokens", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapExactETHForTokens", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapExactTokensForAVAX", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapExactTokensForETH", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapExactTokensForTokens", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint256", "name": "amountInMax", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapTokensForExactAVAX", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint256", "name": "amountInMax", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapTokensForExactETH", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint256", "name": "amountInMax", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "swapTokensForExactTokens", "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ], "stateMutability": "nonpayable", "type": "function" } ];
  }),

  ERC20ABI: computed( function() {
    return [ { "inputs": [ { "internalType": "string", "name": "name_", "type": "string" }, { "internalType": "string", "name": "symbol_", "type": "string" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "burnAddress", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "nonpayable", "type": "function" } ];
  }),

  contractABI: computed( function() {
    return   [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "address", "name": "sender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "time", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "tokenAddress", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "poolIndex", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "Burn", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" }, { "inputs": [], "name": "_router", "outputs": [ { "internalType": "contract ISwapRouter", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" } ], "name": "amountBurnt", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "boneAddress", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "burnAddress", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnBone", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnLeash", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnRyoshi", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnShib", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "poolIndex", "type": "uint256" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnTokenForPool", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "burnersByIndex", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "minOut", "type": "uint256" } ], "name": "buyAndBurn", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "uint256", "name": "poolIndex", "type": "uint256" } ], "name": "buyAndBurnForPool", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "currentUser", "type": "address" }, { "internalType": "address", "name": "tokenAddress", "type": "address" } ], "name": "getInfo", "outputs": [ { "internalType": "uint256[]", "name": "", "type": "uint256[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "poolIndex", "type": "uint256" }, { "internalType": "address", "name": "currentUser", "type": "address" }, { "internalType": "address", "name": "tokenAddress", "type": "address" } ], "name": "getInfoForPool", "outputs": [ { "internalType": "uint256[]", "name": "", "type": "uint256[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" } ], "name": "getTokenInfo", "outputs": [ { "internalType": "string[]", "name": "", "type": "string[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "leashAddress", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "ryoshiAddress", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "poolIndex", "type": "uint256" }, { "internalType": "address", "name": "xTokenAddress", "type": "address" } ], "name": "setXTokenForPool", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "shibAddress", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "totalBurners", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "totalBurnt", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "trackBurnerIndexes", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "poolIndex", "type": "uint256" } ], "name": "trackIndexesForPool", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "xTokens", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" } ];
  }),

  lpABI: computed(function() {
    return JSON.parse('[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]');
  }),

  rewarderABI: computed(function() {
    return [{"inputs":[{"internalType":"address","name":"token_","type":"address"},{"internalType":"bytes32","name":"merkleRoot_","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"index","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"uint256","name":"week","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"merkleRoot","type":"bytes32"},{"indexed":true,"internalType":"uint32","name":"week","type":"uint32"}],"name":"MerkleRootUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"},{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32[]","name":"merkleProof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"freeze","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"frozen","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"isClaimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"merkleRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"},{"internalType":"bool","name":"direct","type":"bool"},{"internalType":"bool","name":"renounce","type":"bool"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unfreeze","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"}],"name":"updateMerkleRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"week","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"}];
  }),


});
