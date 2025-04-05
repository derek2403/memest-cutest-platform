// Use .cjs extension to force CommonJS mode regardless of package.json settings
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

const privateKey =
  process.env.PRIVATE_KEY ||
  "0x6906b2082e6d499c54d2356f735b42a01b553a4978e67f190b7ceb7fd6c306d0";
const rpc = "https://arb1.arbitrum.io/rpc";
const authKey = process.env.AUTH_KEY || "MGSIHfWToI4VXtUAwvzmjgRSiUdxLogC";
const source = "sdk-tutorial";

// Create the web3 instance
const web3 = new Web3(rpc);
const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;

console.log(`Using wallet address: ${walletAddress}`);

const sdk = new SDK({
  url: "https://api.1inch.dev/fusion-plus",
  authKey,
  blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3),
});

function sleep(ms) {
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
    console.log("Getting quote...");
    const quote = await sdk.getQuote({
      amount: "1000000000000000", // 0.001 ETH in wei
      srcChainId: NetworkEnum.ARBITRUM,
      dstChainId: NetworkEnum.POLYGON,
      enableEstimate: true,
      srcTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
      dstTokenAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
      walletAddress,
    });

    // Use the custom replacer function to handle BigInt values
    console.log("Quote received:", JSON.stringify(quote, jsonReplacer, 2));

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
    console.log("Creating order...");
    const { hash, quoteId, order } = await sdk.createOrder(quote, {
      walletAddress,
      hashLock,
      preset,
      source,
      secretHashes,
    });
    console.log({ hash }, "order created");

    // submit order
    console.log("Submitting order...");
    const _orderInfo = await sdk.submitOrder(
      quote.srcChainId,
      order,
      quoteId,
      secretHashes
    );
    console.log({ hash }, "order submitted");

    // submit secrets for deployed escrows
    console.log("Monitoring order status...");
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
      console.log("Current status:", status);

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
    console.log(
      "Final status:",
      JSON.stringify(statusResponse, jsonReplacer, 2)
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
