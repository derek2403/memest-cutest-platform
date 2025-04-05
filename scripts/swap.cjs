const { Web3 } = require("web3");
const {
  SDK,
  NetworkEnum,
  PresetEnum,
  HashLock,
  OrderStatus,
} = require("@1inch/cross-chain-sdk");
const { randomBytes } = require("crypto");
const { PrivateKeyProviderConnector } = require("@1inch/fusion-sdk");
require("dotenv").config();

const privateKey = process.env.WALLET_KEY;
const rpc = process.env.RPC_URL;
const authKey = process.env.DEV_PORTAL_KEY;
const source = "sdk-tutorial";

// Enhanced logging function with timestamp and optional object details
function logWithTimestamp(message, obj = null) {
  const timestamp = new Date().toISOString();
  if (obj) {
    console.log(
      `[${timestamp}] ${message}`,
      JSON.stringify(obj, jsonReplacer, 2)
    );
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Create the web3 instance
logWithTimestamp("🔄 Initializing Web3 with RPC:", { rpc });
const web3 = new Web3(rpc);
const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
const val = 8000000000000000;

logWithTimestamp("👤 Using wallet address:", { walletAddress });
logWithTimestamp("🔑 Auth key configured:", {
  authKeyLength: authKey ? authKey.length : 0,
});

const sdk = new SDK({
  url: "https://api.1inch.dev/fusion-plus",
  authKey,
  blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3),
});
logWithTimestamp("✅ SDK initialized successfully");

function sleep(ms) {
  logWithTimestamp(`⏱️ Sleeping for ${ms}ms`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Custom replacer function to handle BigInt serialization
function jsonReplacer(key, value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

async function main() {
  try {
    // estimate
    logWithTimestamp("🚀 Starting cross-chain swap process");
    logWithTimestamp("📊 Getting quote with parameters:", {
      amount: val,
      srcChainId: NetworkEnum.ARBITRUM,
      dstChainId: NetworkEnum.POLYGON,
      srcTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
      dstTokenAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
    });

    const quote = await sdk.getQuote({
      amount: val,
      srcChainId: NetworkEnum.ARBITRUM,
      dstChainId: NetworkEnum.POLYGON,
      enableEstimate: true,
      srcTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
      dstTokenAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
      walletAddress,
    });

    // Use the custom replacer function to handle BigInt values
    logWithTimestamp("✅ Quote received successfully", {
      srcTokenAmount: quote.srcTokenAmount,
      dstTokenAmount: quote.dstTokenAmount,
      srcChainId: quote.srcChainId,
      dstChainId: quote.dstChainId,
      presets: Object.keys(quote.presets),
    });

    logWithTimestamp("📝 Full quote details:", quote);

    const preset = PresetEnum.fast;
    logWithTimestamp(`🔧 Using preset: ${preset}`);

    // generate secrets
    logWithTimestamp(
      `🔐 Generating ${quote.presets[preset].secretsCount} secrets`
    );
    const secrets = Array.from({
      length: quote.presets[preset].secretsCount,
    }).map(() => "0x" + randomBytes(32).toString("hex"));

    logWithTimestamp("🔑 Secrets generated", { count: secrets.length });

    const hashLock =
      secrets.length === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets));
    logWithTimestamp("🔒 HashLock created", {
      type: secrets.length === 1 ? "SingleFill" : "MultipleFills",
    });

    const secretHashes = secrets.map((s) => HashLock.hashSecret(s));
    logWithTimestamp("🔏 Secret hashes generated", {
      count: secretHashes.length,
    });

    // create order
    logWithTimestamp("📝 Creating order with parameters:", {
      walletAddress,
      preset,
      source,
      secretHashesCount: secretHashes.length,
    });

    const { hash, quoteId, order } = await sdk.createOrder(quote, {
      walletAddress,
      hashLock,
      preset,
      source,
      secretHashes,
    });
    logWithTimestamp("✅ Order created successfully", { hash, quoteId });
    logWithTimestamp("📄 Order details:", order);

    // submit order
    logWithTimestamp("📤 Submitting order to blockchain", {
      srcChainId: quote.srcChainId,
      quoteId,
      secretHashesCount: secretHashes.length,
    });

    const orderInfo = await sdk.submitOrder(
      quote.srcChainId,
      order,
      quoteId,
      secretHashes
    );
    logWithTimestamp("✅ Order submitted successfully", { hash });
    logWithTimestamp("📄 Order submission details:", orderInfo);

    // submit secrets for deployed escrows
    logWithTimestamp("🔍 Starting order status monitoring loop", { hash });
    let loopCount = 0;

    while (true) {
      loopCount++;
      logWithTimestamp(`⏳ Monitoring iteration #${loopCount}`, { hash });

      logWithTimestamp("🔍 Checking for ready-to-accept secret fills");
      const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash);
      logWithTimestamp("📊 Ready-to-accept fills status", {
        fillsCount: secretsToShare.fills.length,
        fills: secretsToShare.fills,
      });

      if (secretsToShare.fills.length) {
        for (const { idx } of secretsToShare.fills) {
          logWithTimestamp(`🔓 Submitting secret for fill index ${idx}`);
          await sdk.submitSecret(hash, secrets[idx]);
          logWithTimestamp(`✅ Secret shared successfully for index ${idx}`);
        }
      }

      // check if order finished
      logWithTimestamp("🔍 Checking order status");
      const { status } = await sdk.getOrderStatus(hash);
      logWithTimestamp(`📊 Current order status: ${status}`);

      if (
        status === OrderStatus.Executed ||
        status === OrderStatus.Expired ||
        status === OrderStatus.Refunded
      ) {
        logWithTimestamp(`🏁 Order reached final status: ${status}`, { hash });
        break;
      }

      logWithTimestamp(
        `⏳ Order still in progress (status: ${status}), waiting...`
      );
      await sleep(1000);
    }

    logWithTimestamp("🔍 Getting final order status details");
    const statusResponse = await sdk.getOrderStatus(hash);
    logWithTimestamp("🏁 Final order status details:", statusResponse);

    logWithTimestamp("✅ Cross-chain swap process completed");
  } catch (error) {
    logWithTimestamp("❌ Error occurred during execution", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (error.response) {
      logWithTimestamp("🔍 API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    console.error("Stack trace:", error.stack);
  }
}

logWithTimestamp("🚀 Starting main function");
main()
  .then(() => {
    logWithTimestamp("👋 Script execution completed");
  })
  .catch((err) => {
    logWithTimestamp("💥 Unhandled error in main promise", {
      message: err.message,
      stack: err.stack,
    });
  });
