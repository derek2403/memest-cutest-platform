const {
  HashLock,
  NetworkEnum,
  OrderStatus,
  PresetEnum,
  PrivateKeyProviderConnector,
  SDK,
} = require("@1inch/cross-chain-sdk");
const { Web3 } = require("web3");
const { randomBytes } = require("crypto");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
const rpc = process.env.ALCHEMY_URL;
const authKey = process.env.AUTH_KEY;
const source = "sdk-tutorial";

const web3 = new Web3(rpc);
const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;

const sdk = new SDK({
  url: "https://api.1inch.dev/fusion-plus",
  authKey,
  blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3),
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkBalance(web3, tokenAddress, walletAddress, requiredAmount) {
  // For ETH/Native token
  if (
    tokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  ) {
    const balance = await web3.eth.getBalance(walletAddress);
    const balanceInEth = web3.utils.fromWei(balance, "ether");
    const requiredInEth = web3.utils.fromWei(requiredAmount, "ether");
    console.log(`Native token balance: ${balanceInEth} ETH`);
    console.log(`Required amount: ${requiredInEth} ETH`);
    return BigInt(balance) >= BigInt(requiredAmount);
  }

  // For ERC20 tokens
  const minABI = [
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  ];

  const contract = new web3.eth.Contract(minABI, tokenAddress);
  const balance = await contract.methods.balanceOf(walletAddress).call();
  console.log(`Token balance: ${balance}`);
  console.log(`Required amount: ${requiredAmount}`);
  return BigInt(balance) >= BigInt(requiredAmount);
}

async function checkAllowance(
  web3,
  tokenAddress,
  walletAddress,
  spenderAddress,
  requiredAmount
) {
  // No allowance needed for native token
  if (
    tokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  ) {
    return true;
  }

  const minABI = [
    {
      constant: true,
      inputs: [
        { name: "_owner", type: "address" },
        { name: "_spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "", type: "uint256" }],
      type: "function",
    },
  ];

  const contract = new web3.eth.Contract(minABI, tokenAddress);
  const allowance = await contract.methods
    .allowance(walletAddress, spenderAddress)
    .call();
  console.log(`Current allowance: ${allowance}`);
  console.log(`Required allowance: ${requiredAmount}`);
  return BigInt(allowance) >= BigInt(requiredAmount);
}

async function checkLiquidity(
  sdk,
  amount,
  srcChainId,
  dstChainId,
  srcTokenAddress,
  dstTokenAddress,
  walletAddress
) {
  try {
    const quote = await sdk.getQuote({
      amount,
      srcChainId,
      dstChainId,
      enableEstimate: true,
      srcTokenAddress,
      dstTokenAddress,
      walletAddress,
    });

    console.log("Quote received successfully:");
    console.log(`Input Amount: ${quote.srcTokenAmount}`);
    console.log(`Output Amount: ${quote.dstTokenAmount}`);
    return true;
  } catch (error) {
    console.error("Liquidity check failed:", error.message);
    return false;
  }
}

async function main() {
  const amount = "1000000000000000"; // 0.001 ETH
  const INCH_ROUTER = "0x1111111254eeb25477b68fb85ed929f73a960582";
  const srcToken = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"; // WETH on Arbitrum

  console.log("Performing pre-flight checks...");

  // Check balance
  const hasBalance = await checkBalance(web3, srcToken, walletAddress, amount);
  if (!hasBalance) {
    throw new Error("Insufficient source token balance");
  }
  console.log("✅ Balance check passed");

  // Check allowance
  const hasAllowance = await checkAllowance(
    web3,
    srcToken,
    walletAddress,
    INCH_ROUTER,
    amount
  );
  if (!hasAllowance) {
    throw new Error("Insufficient allowance for 1inch router");
  }
  console.log("✅ Allowance check passed");

  // Check liquidity
  const hasLiquidity = await checkLiquidity(
    sdk,
    amount,
    NetworkEnum.ARBITRUM,
    NetworkEnum.OPTIMISM,
    srcToken,
    "0x4200000000000000000000000000000000000006", // WETH on Optimism
    walletAddress
  );
  if (!hasLiquidity) {
    throw new Error("Insufficient liquidity for swap");
  }
  console.log("✅ Liquidity check passed");

  // Continue with the original code...
  const quote = await sdk.getQuote({
    amount,
    srcChainId: NetworkEnum.ARBITRUM,
    dstChainId: NetworkEnum.OPTIMISM,
    enableEstimate: true,
    srcTokenAddress: srcToken,
    dstTokenAddress: "0x4200000000000000000000000000000000000006",
    walletAddress,
  });

  const preset = PresetEnum.fast;

  // generate secrets
  const secrets = Array.from({
    length: quote.presets[preset].secretsCount,
  }).map(() => "0x" + randomBytes(32).toString("hex"));

  const hashLock =
    secrets.length === 1
      ? HashLock.forSingleFill(secrets[0])
      : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets));

  const secretHashes = secrets.map((s) => HashLock.hashSecret(s));

  // create order
  const { hash, quoteId, order } = await sdk.createOrder(quote, {
    walletAddress,
    hashLock,
    preset,
    source,
    secretHashes,
  });
  console.log({ hash }, "order created");

  // submit order
  const _orderInfo = await sdk.submitOrder(
    quote.srcChainId,
    order,
    quoteId,
    secretHashes
  );
  console.log({ hash }, "order submitted");

  // submit secrets for deployed escrows
  while (true) {
    const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash);

    if (secretsToShare.fills.length) {
      for (const { idx } of secretsToShare.fills) {
        await sdk.submitSecret(hash, secrets[idx]);
        console.log({ idx }, "shared secret");
      }
    }

    // check if order finished
    const { status } = await sdk.getOrderStatus(hash);

    if (
      status === OrderStatus.Executed ||
      status === OrderStatus.Expired ||
      status === OrderStatus.Refunded
    ) {
      break;
    }

    await sleep(1000);
  }

  const statusResponse = await sdk.getOrderStatus(hash);
  console.log(statusResponse);
}

main().catch(console.error);
