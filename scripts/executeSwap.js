const { ethers } = require("hardhat");
const axios = require("axios");
const readline = require("readline");
require("dotenv").config();

// Arbitrum Addresses
const TOKENS = {
  WETH: {
    address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
  },
  USDC: {
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  USDT: {
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  ARB: {
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    symbol: "ARB",
    name: "Arbitrum",
    decimals: 18,
  },
  // Add more tokens as needed
};

const ONEINCH_V6_ADDRESS = "0x111111125421ca6dc314280a0f8842a65"; // 1inch universal router

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
  "function symbol() view returns (string)",
];

// Check wallet balances
async function checkBalances(wallet) {
  const address = wallet.address;

  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(address);
  console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  // Check all token balances
  console.log("\nToken Balances:");
  for (const [name, token] of Object.entries(TOKENS)) {
    const contract = new ethers.Contract(token.address, erc20Abi, wallet);
    const balance = await contract.balanceOf(address);
    console.log(
      `${name} Balance: ${ethers.formatUnits(balance, token.decimals)} ${
        token.symbol
      }`
    );
  }

  return { ethBalance };
}

// Wrap ETH to WETH
async function wrapEthToWeth(wallet, amountToWrap) {
  const wrapAmount = ethers.parseEther(amountToWrap.toString());
  const WETH = new ethers.Contract(TOKENS.WETH.address, wethAbi, wallet);

  const tx = await WETH.deposit({ value: wrapAmount });
  await tx.wait();

  console.log(`Wrapped ${amountToWrap} ETH to WETH`);
}

// Approve token for 1inch
async function approveTokenFor1inchRouter(wallet, tokenSymbol, amount) {
  const token = TOKENS[tokenSymbol];
  const tokenContract = new ethers.Contract(token.address, erc20Abi, wallet);
  const approvalAmount = ethers.parseUnits(amount.toString(), token.decimals);

  const tx = await tokenContract.approve(ONEINCH_V6_ADDRESS, approvalAmount);
  await tx.wait();

  console.log(`Approved ${amount} ${tokenSymbol} to 1inch router`);
}

// Swap tokens on Arbitrum using 1inch
async function swapTokens(wallet, fromToken, toToken, amount) {
  const address = wallet.address;
  const amountInWei = ethers.parseUnits(
    amount.toString(),
    TOKENS[fromToken].decimals
  );

  try {
    const response = await axios.get(
      `https://api.1inch.dev/swap/v5.2/42161/swap`,
      {
        params: {
          src: TOKENS[fromToken].address,
          dst: TOKENS[toToken].address,
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

    console.log(`Swapping ${amount} ${fromToken} to ${toToken} on Arbitrum...`);
    console.log(
      `Expected ${toToken}: ${ethers.formatUnits(
        response.data.toAmount,
        TOKENS[toToken].decimals
      )} ${toToken}`
    );

    const gasLimit = txData.gas ? Math.round(txData.gas * 1.5) : 3000000;

    const tx = await wallet.sendTransaction({
      to: txData.to,
      data: txData.data,
      value: txData.value || 0,
      gasLimit: gasLimit,
      ...(txData.gasPrice && { gasPrice: txData.gasPrice }),
    });

    await tx.wait();
    console.log("Swap successful!");

    await checkBalances(wallet);
  } catch (error) {
    console.error("1inch Swap failed:", error?.response?.data || error.message);

    if (error.message.includes("fewer coins than expected")) {
      console.log("\nThis error is due to price impact or slippage.");
      console.log("Solutions:");
      console.log("1. Try increasing the slippage tolerance");
      console.log("2. Try swapping a larger amount");
      console.log("3. Try a different token pair with better liquidity");
    }

    throw error;
  }
}

// Create readline interface for user input
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Helper function to ask questions
function question(rl, query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to validate private key
function isValidPrivateKey(key) {
  // Remove 0x prefix if present
  const cleanKey = key.startsWith("0x") ? key.slice(2) : key;

  // Check if it's a valid hex string with correct length (64 characters = 32 bytes)
  return /^[0-9a-fA-F]{64}$/.test(cleanKey);
}

// Get user input
async function getUserInput() {
  const rl = createInterface();

  console.log("Please enter your information:");
  let privateKey = await question(
    rl,
    "Enter your private key (64 hex characters): "
  );

  // Validate private key
  while (!isValidPrivateKey(privateKey)) {
    console.log(
      "Invalid private key format. A private key should be 64 hexadecimal characters."
    );
    privateKey = await question(
      rl,
      "Enter a valid private key (64 hex characters): "
    );
  }

  // Ensure the key has 0x prefix
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  console.log("\nWhat would you like to do?");
  console.log("1. Check Balances");
  console.log("2. Swap Tokens");
  console.log("3. Wrap ETH to WETH");

  const actionChoice = await question(rl, "Enter your choice (1-3): ");
  let action;

  switch (actionChoice) {
    case "1":
      action = "Check Balances";
      rl.close();
      return { privateKey, action };

    case "2":
      action = "Swap Tokens";
      console.log("\nAvailable tokens:");

      const tokenChoices = [...Object.keys(TOKENS), "ETH"];
      tokenChoices.forEach((token, index) => {
        console.log(`${index + 1}. ${token}`);
      });

      const fromTokenIndex =
        parseInt(
          await question(rl, "Select token to swap from (enter number): ")
        ) - 1;
      if (fromTokenIndex < 0 || fromTokenIndex >= tokenChoices.length) {
        console.log("Invalid selection. Exiting.");
        rl.close();
        process.exit(1);
      }

      const fromToken = tokenChoices[fromTokenIndex];

      // Only offer proper tokens (not ETH) as destination
      const toTokenChoices = Object.keys(TOKENS);
      toTokenChoices.forEach((token, index) => {
        console.log(`${index + 1}. ${token}`);
      });

      const toTokenIndex =
        parseInt(
          await question(rl, "Select token to swap to (enter number): ")
        ) - 1;
      if (toTokenIndex < 0 || toTokenIndex >= toTokenChoices.length) {
        console.log("Invalid selection. Exiting.");
        rl.close();
        process.exit(1);
      }

      const toToken = toTokenChoices[toTokenIndex];

      const amountStr = await question(rl, "Enter amount to swap: ");
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || amount <= 0) {
        console.log("Invalid amount. Exiting.");
        rl.close();
        process.exit(1);
      }

      rl.close();
      return { privateKey, action, fromToken, toToken, amount };

    case "3":
      action = "Wrap ETH to WETH";
      const wrapAmountStr = await question(rl, "Enter amount of ETH to wrap: ");
      const wrapAmount = parseFloat(wrapAmountStr);

      if (isNaN(wrapAmount) || wrapAmount <= 0) {
        console.log("Invalid amount. Exiting.");
        rl.close();
        process.exit(1);
      }

      rl.close();
      return { privateKey, action, wrapAmount };

    default:
      console.log("Invalid choice. Exiting.");
      rl.close();
      process.exit(1);
  }
}

// Main flow
async function main() {
  try {
    const userInput = await getUserInput();

    // Create wallet from private key
    const wallet = new ethers.Wallet(userInput.privateKey, ethers.provider);
    console.log(`Using wallet address: ${wallet.address}`);

    if (userInput.action === "Check Balances") {
      console.log("\nChecking Balances:");
      await checkBalances(wallet);
    } else if (userInput.action === "Wrap ETH to WETH") {
      console.log("\nInitial Balances:");
      const { ethBalance } = await checkBalances(wallet);

      if (ethers.formatEther(ethBalance) < parseFloat(userInput.wrapAmount)) {
        console.log(
          `Not enough ETH. Need at least ${userInput.wrapAmount} ETH.`
        );
        return;
      }

      console.log("\nWrapping ETH...");
      await wrapEthToWeth(wallet, userInput.wrapAmount);

      console.log("\nFinal Balances:");
      await checkBalances(wallet);
    } else if (userInput.action === "Swap Tokens") {
      console.log("\nInitial Balances:");
      await checkBalances(wallet);

      const { fromToken, toToken, amount } = userInput;

      // If swapping from ETH, wrap it first
      if (fromToken === "ETH") {
        console.log("\nWrapping ETH to WETH first...");
        await wrapEthToWeth(wallet, amount);

        console.log("\nApproving WETH for 1inch...");
        await approveTokenFor1inchRouter(wallet, "WETH", amount);

        console.log("\nSwapping WETH to " + toToken + "...");
        await swapTokens(wallet, "WETH", toToken, amount);
      } else {
        console.log(`\nApproving ${fromToken} for 1inch...`);
        await approveTokenFor1inchRouter(wallet, fromToken, amount);

        console.log(`\nSwapping ${fromToken} to ${toToken}...`);
        await swapTokens(wallet, fromToken, toToken, amount);
      }

      console.log("\nFinal Balances:");
      await checkBalances(wallet);
    }
  } catch (err) {
    console.error("Process failed:", err);
    process.exitCode = 1;
  }
}

main();
