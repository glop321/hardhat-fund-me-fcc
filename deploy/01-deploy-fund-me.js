const { network } = require("hardhat");
const {networkConfig, deploymentChains, DECIMALS, INITIAL_ANSWER} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    //Get network price feed
    let ethUSDPriceFeedAddress;
    if(deploymentChains.includes(network.name)){
        const ethUSDAggregator = await deployments.get("MockV3Aggregator");
        ethUSDPriceFeedAddress = ethUSDAggregator.address;
    } else {
        ethUSDPriceFeedAddress = networkConfig[chainId]["ethUSDPriceFeed"];
    }

    //Deploy the contract
    const fundMe = await deploy("FundMe", {
        from: deployer,
        log: true,
        args: [ethUSDPriceFeedAddress],
        waitConfirmations: network.config.waitConfirmations || 1,
    })

    if(!deploymentChains.includes(network.name)){
        //verify
        await verify(fundMe.address, [ethUSDPriceFeedAddress]);
    }
    log('--------------------------------------------------------------')

} 

module.exports.tags = ["all", "fundme"]
