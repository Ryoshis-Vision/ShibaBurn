// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("deployer: ", deployer); 
  console.log("NETWORK: ", network.name); 

  const { ethers, waffle} = require("hardhat");
  const provider = waffle.provider;
  const balanceETH = await provider.getBalance(deployer);
  console.log("Deployer Balance", balanceETH.toString()); 

  var wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // Mainnet

  if (network.name == 'rinkeby')
    wethAddress = '0xc778417e063141139fce010982780140aa0cd5ab'; // RINKEBY

  console.log("WETH ADDRESS: ", network.name); 

  await deploy("ShibaBurn", {
    from: deployer,
    log: true,
    args: [wethAddress],
  });
  const ShibaBurn = await ethers.getContract("ShibaBurn", deployer);

  await deploy("XToken", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [ ShibaBurn.address, "BURNT SHIB", "burntSHIB" ],
    log: true,
  });
  const burntSHIB = await ethers.getContract("XToken", deployer);

  console.log("SETTING xTOKEN FOR POOL", network.name, burntSHIB.address); 
  if (network.name == 'rinkeby')
    await ShibaBurn.setXTokenForPool("0x27498D86b17D5de38ABFAc07a8477eD17859aa5c", 0, burntSHIB.address);
  else
    await ShibaBurn.setXTokenForPool("0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", 0, burntSHIB.address);

};
module.exports.tags = ["ShibaBurn"];
