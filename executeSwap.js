import {
  HashLock,
  NetworkEnum,
  OrderStatus,
  PresetEnum,
  PrivateKeyProviderConnector,
  SDK,
} from "@1inch/cross-chain-sdk";
import { Web3 } from "web3";
import { randomBytes } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpc = process.env.ALCHEMY_URL;
    const authKey = process.env.AUTH_KEY;
    const source = "sdk-tutorial";

    // Get parameters from request
    const { walletAddress } = req.body;

    // Initialize web3 and SDK
    const web3 = new Web3(rpc);
    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey,
      blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3),
    });

    // Set up swap parameters
    const amount = "1000000000000000"; // 0.001 ETH
    const srcToken = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"; // WETH on Arbitrum
    const dstToken = "0x4200000000000000000000000000000000000006"; // WETH on Optimism

    // Get quote
    const quote = await sdk.getQuote({
      amount,
      srcChainId: NetworkEnum.ARBITRUM,
      dstChainId: NetworkEnum.OPTIMISM,
      enableEstimate: true,
      srcTokenAddress: srcToken,
      dstTokenAddress: dstToken,
      walletAddress,
    });

    // Generate secrets for the swap
    const preset = PresetEnum.fast;
    const secrets = Array.from({
      length: quote.presets[preset].secretsCount,
    }).map(() => "0x" + randomBytes(32).toString("hex"));

    const hashLock =
      secrets.length === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets));

    const secretHashes = secrets.map((s) => HashLock.hashSecret(s));

    // Create order
    const { hash, quoteId, order } = await sdk.createOrder(quote, {
      walletAddress,
      hashLock,
      preset,
      source,
      secretHashes,
    });

    // Submit order
    const orderInfo = await sdk.submitOrder(
      quote.srcChainId,
      order,
      quoteId,
      secretHashes
    );

    // Start monitoring for secrets to share
    let status = await sdk.getOrderStatus(hash);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (attempts < maxAttempts) {
      const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash);

      if (secretsToShare.fills.length) {
        for (const { idx } of secretsToShare.fills) {
          await sdk.submitSecret(hash, secrets[idx]);
          console.log({ idx }, "shared secret");
        }
      }

      // Check if order finished
      status = await sdk.getOrderStatus(hash);

      if (
        status.status === OrderStatus.Executed ||
        status.status === OrderStatus.Expired ||
        status.status === OrderStatus.Refunded
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    return res.status(200).json({
      success: true,
      orderHash: hash,
      status: status.status,
    });
  } catch (error) {
    console.error("Swap execution error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
    });
  }
}
