const { ethers } = require("hardhat");
const axios = require("axios");

// Arbitrum Addresses
const WETH_ADDRESS = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const ONEINCH_V6_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65"; // 1inch universal router

// ABIs
const wethAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function deposit() payable",
  "function withdraw(uint256 amount)",
];

const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)",
];

// Check wallet balances
async function checkBalances() {
  const signer = await ethers.provider.getSigner(0);
  const address = await signer.getAddress();

  const ethBalance = await ethers.provider.getBalance(address);
  console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  const WETH = await ethers.getContractAt(wethAbi, WETH_ADDRESS, signer);
  const USDC = await ethers.getContractAt(erc20Abi, USDC_ADDRESS, signer);
  const usdcDecimals = await USDC.decimals();

  const wethBalance = await WETH.balanceOf(address);
  const usdcBalance = await USDC.balanceOf(address);

  console.log(`WETH Balance: ${ethers.formatEther(wethBalance)} WETH`);
  console.log(
    `USDC Balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)} USDC`
  );

  return { ethBalance, wethBalance, usdcBalance, usdcDecimals };
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

// Swap WETH to USDC on Arbitrum using 1inch
async function swapWethToUsdc(amountInWeth) {
  const signer = await ethers.provider.getSigner(0);
  const address = await signer.getAddress();
  const amountInWei = ethers.parseEther(amountInWeth.toString());

  try {
    const response = await axios.get(
      `https://api.1inch.dev/swap/v5.2/42161/swap`,
      {
        params: {
          src: WETH_ADDRESS,
          dst: USDC_ADDRESS,
          amount: amountInWei.toString(),
          from: address,
          slippage: 5,
          disableEstimate: false,
        },
        headers: {
          Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
        },
      }
    );

    const txData = response.data.tx;

    console.log(`Swapping ${amountInWeth} WETH to USDC on Arbitrum...`);
    console.log(
      `Expected USDC: ${response.data.toAmount} (${response.data.toTokenAmount})`
    );

    const gasLimit = txData.gas ? Math.round(txData.gas * 1.5) : 3000000;

    const tx = await signer.sendTransaction({
      to: txData.to,
      data: txData.data,
      value: txData.value || 0,
      gasLimit: gasLimit,
      ...(txData.gasPrice && { gasPrice: txData.gasPrice }),
    });

    await tx.wait();
    console.log("Swap successful!");

    await checkBalances();
  } catch (error) {
    console.error("1inch Swap failed:", error?.response?.data || error.message);

    if (error.message.includes("fewer coins than expected")) {
      console.log("\nThis error is due to price impact or slippage.");
      console.log("Solutions:");
      console.log("1. Try increasing the slippage tolerance even more");
      console.log("2. Try swapping a larger amount (0.001 WETH is very small)");
      console.log("3. Try a different token pair with better liquidity");
    }

    throw error;
  }
}

// Main flow
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

    console.log("\nSwapping WETH to USDC...");
    await swapWethToUsdc(ethToWrap);

    console.log("\nFinal Balances:");
    await checkBalances();
  } catch (err) {
    console.error("Process failed:", err);
    process.exitCode = 1;
  }
}

main();
