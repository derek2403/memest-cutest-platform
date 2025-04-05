require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      // Local development network
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/WJToNO7e77R0qnDQ709sdJgY2ZoHj2od",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
    arbitrum: {
      url: "https://arb-mainnet.g.alchemy.com/v2/WJToNO7e77R0qnDQ709sdJgY2ZoHj2od",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42161,
    },
  },
};
