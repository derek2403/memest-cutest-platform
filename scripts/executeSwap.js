const { ethers } = require("hardhat");

// Arbitrum Addresses
const WETH_ADDRESS = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
const ONEINCH_V6_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65";

// ABIs
const wethAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function deposit() payable",
  "function withdraw(uint256 amount)",
];

// Check wallet balances
async function checkBalances() {
  const signer = await ethers.provider.getSigner(0);
  const address = await signer.getAddress();

  const ethBalance = await ethers.provider.getBalance(address);
  console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  const WETH = await ethers.getContractAt(wethAbi, WETH_ADDRESS, signer);
  const wethBalance = await WETH.balanceOf(address);

  console.log(`WETH Balance: ${ethers.formatEther(wethBalance)} WETH`);
  return { ethBalance, wethBalance };
}

// Wrap ETH to WETH
async function wrapEthToWeth(amountToWrap) {
  const signer = await ethers.provider.getSigner(0);
  const wrapAmount = ethers.parseEther(amountToWrap.toString());

  const WETH = await ethers.getContractAt(wethAbi, WETH_ADDRESS, signer);
  const tx = await WETH.deposit({ value: wrapAmount });
  await tx.wait();

  console.log(`Wrapped ${amountToWrap} ETH to WETH`);
}

// Approve WETH to 1inch
async function approveWethFor1inchRouter(amount) {
  const signer = await ethers.provider.getSigner(0);
  const approvalAmount = ethers.parseEther(amount.toString());

  const WETH = await ethers.getContractAt(wethAbi, WETH_ADDRESS, signer);
  const tx = await WETH.approve(ONEINCH_V6_ADDRESS, approvalAmount);
  await tx.wait();

  console.log(`Approved ${amount} WETH to 1inch router`);
}

// Main flow (no swap yet)
async function main() {
  try {
    console.log("Initial Balances:");
    const { ethBalance } = await checkBalances();

    const ethToWrap = 0.001;
    if (ethers.formatEther(ethBalance) < ethToWrap) {
      console.log(`Not enough ETH. Need at least ${ethToWrap} ETH.`);
      return;
    }

    console.log("\nWrapping ETH...");
    await wrapEthToWeth(ethToWrap);

    console.log("\nApproving WETH for 1inch...");
    await approveWethFor1inchRouter(ethToWrap);

    console.log("\nFinal Balances:");
    await checkBalances();
  } catch (err) {
    console.error("Process failed:", err);
    process.exitCode = 1;
  }
}

main();
