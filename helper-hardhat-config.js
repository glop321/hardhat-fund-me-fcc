const networkConfig = {
    11155111: {
        name: "sepolia",
        ethUSDPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
    31337: {
        name: "localhost",
    }
}

const deploymentChains = ["hardhat", "localhost"];
const DECIMALS = 8;
const INITIAL_ANSWER = 3000 * 1e8;

module.exports =    {networkConfig, deploymentChains, DECIMALS, INITIAL_ANSWER}