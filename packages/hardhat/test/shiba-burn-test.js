// const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require("chai");

require('@nomiclabs/hardhat-truffle4');
require('@nomiclabs/hardhat-truffle5');

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');


const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const shibAddress = '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE';

var burntShib;
var shibaburn;
var shibaSwap;

const gasUsed = async function(transaction) {
  var fullTx = await web3.eth.getTransaction(transaction.tx);
  return BigInt(transaction.receipt.gasUsed) * BigInt(fullTx.gasPrice);
}

const expectBuyAndBurn = async function(statusOrError, ethAmount, from) {
    var amountOut = (await shibaSwap.getAmountsOut(BigInt(ethAmount * 10**18), [
      wethAddress, shibAddress
    ]))[1];

  try {
    var tx = await shibaburn.buyAndBurn(shibAddress, BigInt(amountOut * 0.97), {
        // nonce: await web3.eth.getTransactionCount(from),
        value: BigInt(ethAmount * 10**18),
        from: from,
      }
    );
    console.log("  Burn succeeded");
    expect(statusOrError == 'success').to.equal(true);
  } catch(err) {
    console.log("  Burn failed, expected:", statusOrError);
    console.log("  Burn failed", err);
    expect(err.toString().includes(statusOrError)).to.equal(true);
  }

  return tx;
};
const expectBurn = async function(statusOrError, shibAmount, from) {

  try {
    var tx = await shibaburn.burnShib(shibAmount, {
        // nonce: await web3.eth.getTransactionCount(from),
        from: from,
      }
    );
    console.log("  Burn succeeded");
    expect(statusOrError == 'success').to.equal(true);
  } catch(err) {
    console.log("  Burn failed, expected:", statusOrError);
    console.log("  Burn failed", err);
    expect(err.toString().includes(statusOrError)).to.equal(true);
  }

  return tx;
};

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



describe('Shiba Burn', function(accounts) {
  var IERC20;
  var addr2;
  var addr1;

  var shib;

  var account0;
  var account1;
  var account2;

  beforeEach(async function () {
    [account0, account1, account2] = await ethers.getSigners();
    web3.eth.defaultAccount = account0.address;

    ShibaBurn = await ethers.getContractFactory("ShibaBurn");
    BurntShib = await ethers.getContractFactory("XToken");

    var ierc20Abi = await hre.artifacts.readArtifact("IERC20");
    var iSwapAbi = await hre.artifacts.readArtifact("ISwapper");

    shibaSwap = new ethers.Contract('0x03f7724180aa6b939894b5ca4314783b0b36b329', iSwapAbi.abi);
    shib = new ethers.Contract(shibAddress, ierc20Abi.abi);

    shibaburn = shibaburn || await ShibaBurn.deploy(wethAddress);

    if (burntShib == null) {
      burntShib = burntShib || await BurntShib.deploy(shibaburn.address, 'Burnt Shiba Inu', 'burntSHIB');

      //////////////////////////
      // NOT TRACKING INDEXES OR MINTING xTOKENS in this test:
      //
      // await shibaburn.setXTokenForPool(shib.address, 0, burntShib.address);
      // await shibaburn.trackIndexesForPool(shib.address, 0, trackingThreshold);
    }
  });

  it("should burn shib from our frens", async function() {
    var accounts = await web3.eth.getAccounts();
    shib = await shib.connect(account0);
    burntShib = await burntShib.connect(account0);
    shibaSwap = await shibaSwap.connect(account0);
    console.log("swap exact eth:", wethAddress, shib.address);

    console.log("BUYING SHIB:");

    t = await shibaSwap.swapExactETHForTokens('0',[
      wethAddress,
      shib.address,
    ], accounts[0], Date.now() + 1000000, {
      value: BigInt(1 * 10**18),
      from: accounts[0],
    });

    var burntShibBalance = (await burntShib.balanceOf(accounts[0])).toString();
    expect(burntShibBalance).to.equal('0');

    var shibBalance = BigInt((await shib.balanceOf(accounts[0])).toString());
    expect(shibBalance > 0).to.equal(true);
    console.log("SHIB BOUGHT!", shibBalance);

    console.log("expect fail, unapproved::");
    var tx = await expectBurn("SafeMath: subtraction overflow",
      shibBalance, accounts[0],
    );

    await shib.approve(shibaburn.address, shibBalance);

    console.log("expect fail:");
    var tx = await expectBurn("insufficient token balance",
      shibBalance + BigInt(1), accounts[0],
    );

    console.log("expect success:");
    var tx = await expectBurn("success",
      shibBalance, accounts[0],
    );
    expect(await shibaburn.amountBurnt(shib.address, 0, accounts[0])).to.eq(shibBalance);
    expect(await shibaburn.totalBurnt(shib.address, 0)).to.eq(shibBalance);

    burntShibBalance = (await burntShib.balanceOf(accounts[0])).toString();
    expect(burntShibBalance).to.equal('0');

    shibBalance = BigInt((await shib.balanceOf(accounts[0])).toString());
    expect(shibBalance).to.equal(0n);

  });

  it("allows frens to burn multiple times", async function() {
    var accounts = await web3.eth.getAccounts();
    shib = await shib.connect(account1);
    shibaSwap = await shibaSwap.connect(account1);
    shibaburn = await shibaburn.connect(account1);

    var previouslyBurnt = BigInt(await shibaburn.totalBurnt(shib.address, 0));
    expect(await shibaburn.totalTrackedBurners(shib.address, 0)).to.eq(0);

    t = await shibaSwap.swapExactETHForTokens('0',[
      wethAddress,
      shib.address,
    ], accounts[1], Date.now() + 1000000, {
      value: BigInt(1 * 10**18),
      from: accounts[1],
    });

    var shibBalance = BigInt((await shib.balanceOf(accounts[1])).toString());
    expect(shibBalance > 0).to.equal(true);
    console.log("SHIB BOUGHT!", shibBalance);



    console.log("expect fail, unapproved::");
    var tx = await expectBurn("SafeMath: subtraction overflow",
      shibBalance/2n, accounts[1],
    );

    await shib.approve(shibaburn.address, shibBalance);

    console.log("expect fail:");
    var tx = await expectBurn("insufficient token balance",
      shibBalance + BigInt(1), accounts[1],
    );

    console.log("expect success:");
    var tx = await expectBurn("success",
      shibBalance/2n, accounts[1],
    );
    expect(await shibaburn.amountBurnt(shib.address, 0, accounts[1])).to.eq(shibBalance/2n);
    expect(await shibaburn.totalBurnt(shib.address, 0)).to.eq(previouslyBurnt + (shibBalance/2n));
    expect(await shibaburn.totalTrackedBurners(shib.address, 0)).to.eq(0);

    var tx = await expectBurn("success",
      shibBalance - (shibBalance / 2n), accounts[1],
    );
    expect(await shibaburn.amountBurnt(shib.address, 0, accounts[1])).to.eq(shibBalance);
    expect(await shibaburn.totalBurnt(shib.address, 0)).to.eq(previouslyBurnt + shibBalance);
    expect(await shibaburn.totalTrackedBurners(shib.address, 0)).to.eq(0);
  });

  it("allows frens to buy and burn in one TX", async function() {
    var accounts = await web3.eth.getAccounts();
    shib = await shib.connect(account2);
    shibaSwap = await shibaSwap.connect(account2);
    shibaburn = await shibaburn.connect(account2);

    var previouslyBurnt = BigInt(await shibaburn.totalBurnt(shib.address, 0));

    console.log("expect success:");
    var tx = await expectBuyAndBurn("success",
      1, accounts[2],
    );

    var userBurnt = await shibaburn.amountBurnt(shib.address, 0, accounts[2]);
    expect(userBurnt).to.gt(0);

    var totalBurnt = await shibaburn.totalBurnt(shib.address, 0);
    expect(totalBurnt).to.gt(previouslyBurnt);

    expect(await shibaburn.totalTrackedBurners(shib.address, 0)).to.eq(0);

    //TESTING INFO:
    console.log("get info");
    var info = await shibaburn.getInfo(accounts[2], shib.address);
    console.log(info);
    expect(info[0].toString()).to.eq('18');
    expect(info[1]).to.eq(totalBurnt);
    expect(info[2]).to.eq(userBurnt);
    expect(info[3]).to.eq(0);
    var userEthBalance = (await web3.eth.getBalance(accounts[2])).toString();
    expect(info[4].toString()).to.eq(userEthBalance);
  });

  

});



