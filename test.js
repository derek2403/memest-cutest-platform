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

// Debug environment variables
console.log("Environment variables loaded:");
console.log("ALCHEMY_URL:", process.env.ALCHEMY_URL ? "✓ Found" : "✗ Missing");
console.log("AUTH_KEY:", process.env.AUTH_KEY ? "✓ Found" : "✗ Missing");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✓ Found" : "✗ Missing");

// Check if private key is in the correct format
if (process.env.PRIVATE_KEY) {
  const pkFormat = process.env.PRIVATE_KEY.startsWith("0x")
    ? "Has 0x prefix"
    : "Missing 0x prefix";
  console.log("PRIVATE_KEY format:", pkFormat);
  console.log("PRIVATE_KEY length:", process.env.PRIVATE_KEY.length);
}

const privateKey = process.env.PRIVATE_KEY;
const rpc = process.env.ALCHEMY_URL;
const authKey = process.env.AUTH_KEY;
const source = "sdk-tutorial";

try {
  const web3 = new Web3(rpc);
  const walletAddress =
    web3.eth.accounts.privateKeyToAccount(privateKey).address;
  console.log("Successfully created wallet address:", walletAddress);

  const sdk = new SDK({
    url: "https://api.1inch.dev/fusion-plus",
    authKey,
    blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3), // only required for order creation
  });

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function main() {
    // estimate
    const quote = await sdk.getQuote({
      amount: "100000000000000000",
      srcChainId: NetworkEnum.ARBITRUM,
      dstChainId: NetworkEnum.OPTIMISM,
      enableEstimate: true,
      srcTokenAddress: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", //ETH
      dstTokenAddress: "0x4200000000000000000000000000000000000006", //ETH
      walletAddress,
    });

    console.log(quote);

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

    //submit order
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
} catch (error) {
  console.error("Error initializing Web3 or SDK:", error.message);
  console.error("Full error:", error);
}
