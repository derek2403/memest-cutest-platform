// Import necessary classes and functions from the 1inch SDK and other libraries
const {
  SDK,
  HashLock,
  PrivateKeyProviderConnector,
  NetworkEnum,
} = require("@1inch/cross-chain-sdk");
const env = require("dotenv");
const process = env.config().parsed;

const { Web3 } = require("web3");
const {
  solidityPackedKeccak256,
  randomBytes,
  Contract,
  Wallet,
  JsonRpcProvider,
} = require("ethers");

// Helper function to generate a random 32-byte hex string with "0x" prefix
function getRandomBytes32() {
  // for some reason the cross-chain-sdk expects a leading 0x and can't handle a 32 byte long hex string
  return "0x" + Buffer.from(randomBytes(32)).toString("hex");
}

// Load environment variables (wallet key, address, RPC URL, and 1inch API key)
const makerPrivateKey = process?.WALLET_KEY;
const makerAddress = process?.WALLET_ADDRESS;
const nodeUrl = process?.RPC_URL; // suggested for ethereum https://eth.llamarpc.com
const devPortalApiKey = process?.DEV_PORTAL_KEY;

// Ensure all necessary environment variables are set
if (!makerPrivateKey || !makerAddress || !nodeUrl || !devPortalApiKey) {
  throw new Error(
    "Missing required environment variables. Please check your .env file."
  );
}

// Create a Web3 instance and initialize a blockchain provider using a private key
const web3Instance = new Web3(nodeUrl);
const blockchainProvider = new PrivateKeyProviderConnector(
  makerPrivateKey,
  web3Instance
);

// Initialize the 1inch Cross-Chain SDK with API endpoint and auth key
const sdk = new SDK({
  url: "https://api.1inch.dev/fusion-plus",
  authKey: devPortalApiKey,
  blockchainProvider,
});

// Set source and destination chains and token addresses
let srcChainId = NetworkEnum.ARBITRUM;
let dstChainId = NetworkEnum.COINBASE;
let srcTokenAddress = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
let dstTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// ABI for approving ERC-20 tokens
const approveABI = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Add helper functions for delay and exponential backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Add a logging utility
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO][${timestamp}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR][${timestamp}] ${message}`);
    if (error) {
      if (error.response) {
        console.error(
          JSON.stringify(
            {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            },
            null,
            2
          )
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  },
  debug: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG][${timestamp}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN][${timestamp}] ${message}`);
    if (data) console.warn(JSON.stringify(data, null, 2));
  },
};

// Add a simple request queue implementation
class RequestQueue {
  constructor(minDelayMs = 15000) {
    this.queue = [];
    this.isProcessing = false;
    this.minDelayMs = minDelayMs;
    this.lastRequestTime = 0;
    logger.info(`Request queue initialized with ${minDelayMs}ms minimum delay`);
  }

  async add(requestFn, requestName = "unnamed") {
    logger.debug(
      `Adding request to queue: ${requestName}, Queue length: ${this.queue.length}`
    );
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
        requestName,
      });

      if (!this.isProcessing) {
        logger.debug("Queue was idle, starting processing");
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      logger.debug("Queue empty, processing stopped");
      return;
    }

    this.isProcessing = true;
    const { requestFn, resolve, reject, requestName } = this.queue.shift();
    logger.debug(
      `Processing request: ${requestName}, Remaining in queue: ${this.queue.length}`
    );

    // Ensure minimum delay between requests
    const now = Date.now();
    const timeElapsed = now - this.lastRequestTime;
    if (timeElapsed < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeElapsed;
      logger.info(
        `Rate limiting: Waiting ${
          waitTime / 1000
        } seconds before next request (${requestName})`
      );
      await delay(waitTime);
    }

    try {
      logger.debug(`Executing request: ${requestName}`);
      // Make the request with retry logic
      const result = await makeRetryableRequest(requestFn, requestName);
      this.lastRequestTime = Date.now();
      logger.debug(`Request completed successfully: ${requestName}`);
      resolve(result);
    } catch (error) {
      logger.error(`Request failed: ${requestName}`, error);
      reject(error);
    } finally {
      // Process next item in queue after a delay
      const nextDelay = this.minDelayMs;
      logger.debug(
        `Scheduling next queue processing in ${nextDelay / 1000} seconds`
      );
      setTimeout(() => this.processQueue(), nextDelay);
    }
  }
}

// Create a global request queue
const requestQueue = new RequestQueue(15000); // 15 seconds minimum between requests

const makeRetryableRequest = async (
  requestFn,
  requestName = "unnamed",
  initialDelay = 10000,
  maxRetries = 5
) => {
  let retries = 0;
  let currentDelay = initialDelay;

  while (retries < maxRetries) {
    try {
      logger.debug(
        `Executing API call (${requestName}), attempt ${retries + 1}/${
          maxRetries + 1
        }`
      );
      const result = await requestFn();
      logger.debug(`API call successful (${requestName})`);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        retries++;
        if (retries === maxRetries) {
          logger.error(
            `Max retries (${maxRetries}) reached for request (${requestName})`,
            error
          );
          throw new Error(
            `Max retries (${maxRetries}) reached after rate limit errors`
          );
        }
        logger.warn(
          `Rate limit hit for request (${requestName}), waiting ${
            currentDelay / 1000
          } seconds before retry ${retries}/${maxRetries}`
        );
        await delay(currentDelay);
        currentDelay *= 2; // Exponential backoff
      } else {
        logger.error(
          `Non-rate-limit error for request (${requestName})`,
          error
        );
        throw error;
      }
    }
  }
};

// Main execution
(async () => {
  const invert = false;

  // If `invert` is true, swap source and destination chains/tokens
  if (invert) {
    const temp = srcChainId;
    srcChainId = dstChainId;
    dstChainId = temp;

    const tempAddress = srcTokenAddress;
    srcTokenAddress = dstTokenAddress;
    dstTokenAddress = tempAddress;
  }

  logger.info("Starting 1inch cross-chain swap process", {
    sourceChain: srcChainId,
    destChain: dstChainId,
    sourceToken: srcTokenAddress,
    destToken: dstTokenAddress,
    walletAddress: makerAddress,
  });

  // Approve the source token for spending by the 1inch Aggregation Router (v6)
  try {
    logger.info("Approving token for spending");
    const provider = new JsonRpcProvider(nodeUrl);
    const tkn = new Contract(
      srcTokenAddress,
      approveABI,
      new Wallet(makerPrivateKey, provider)
    );
    const tx = await tkn.approve(
      "0x111111125421ca6dc452d289314280a0f8842a65", // Aggregation router address
      2n ** 256n - 1n // Maximum allowance (unlimited)
    );
    logger.info(`Approval transaction submitted: ${tx.hash}`);

    // Wait for the approval transaction to be mined
    await delay(15000); // Add delay after approval transaction
  } catch (error) {
    logger.error("Failed to approve token", error);
    process.exit(1);
  }

  // Prepare parameters to request a cross-chain swap quote
  const params = {
    srcChainId,
    dstChainId,
    srcTokenAddress,
    dstTokenAddress,
    amount: "100000", // 0.001 WETH
    enableEstimate: true,
    walletAddress: makerAddress,
  };

  try {
    logger.info("Requesting Fusion+ quote", params);

    // Use the request queue for getQuote
    const quote = await requestQueue.add(
      () => sdk.getQuote(params),
      "getQuote"
    );

    const secretsCount = quote.getPreset().secretsCount;
    logger.info(`Quote received, requires ${secretsCount} secrets`);

    // Generate an array of random secrets and their hashes
    const secrets = Array.from({ length: secretsCount }).map(() =>
      getRandomBytes32()
    );
    const secretHashes = secrets.map((x) => HashLock.hashSecret(x));
    logger.debug("Generated secrets and hashes", { secretsCount });

    // Create a HashLock object depending on the number of secrets required
    const hashLock =
      secretsCount === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(
            secretHashes.map((secretHash, i) =>
              solidityPackedKeccak256(
                ["uint64", "bytes32"],
                [i, secretHash.toString()]
              )
            )
          );

    logger.info("Placing order on Fusion+ protocol");

    // Use the request queue with exponential backoff for placeOrder
    const quoteResponse = await requestQueue.add(
      () =>
        sdk.placeOrder(quote, {
          walletAddress: makerAddress,
          hashLock,
          secretHashes,
        }),
      "placeOrder"
    );

    const orderHash = quoteResponse.orderHash;
    logger.info(`Order successfully placed with hash: ${orderHash}`);

    const intervalId = setInterval(async () => {
      logger.info(
        `Polling for fills until order status is set to "executed"...`
      );

      try {
        // Queue order status check
        logger.debug(`Queuing order status check for hash: ${orderHash}`);
        const order = await requestQueue.add(
          () => sdk.getOrderStatus(orderHash),
          "getOrderStatus"
        );

        logger.info(`Current order status: ${order.status}`, order);

        if (order.status === "executed") {
          logger.info(`Order is complete. Exiting.`);
          clearInterval(intervalId);
          return;
        }

        // Queue fills check
        logger.debug(`Queuing fills check for hash: ${orderHash}`);
        const fillsObject = await requestQueue.add(
          () => sdk.getReadyToAcceptSecretFills(orderHash),
          "getReadyToAcceptSecretFills"
        );

        logger.info(
          `Found ${fillsObject.fills.length} ready fills`,
          fillsObject
        );

        if (fillsObject.fills.length > 0) {
          for (const fill of fillsObject.fills) {
            try {
              // Queue secret submission
              logger.debug(`Queuing secret submission for fill ${fill.idx}`);
              await requestQueue.add(
                () => sdk.submitSecret(orderHash, secrets[fill.idx]),
                `submitSecret_${fill.idx}`
              );
              logger.info(
                `Secret successfully submitted for fill index: ${fill.idx}`,
                {
                  fillDetails: fill,
                  secretHash: secretHashes[fill.idx],
                }
              );
            } catch (error) {
              logger.error(
                `Error submitting secret for fill index: ${fill.idx}`,
                error
              );
            }
          }
        }
      } catch (error) {
        logger.error("Error during polling cycle", error);
      }
    }, 60000);
  } catch (error) {
    logger.error("Failed during setup process", error);
  }
})().catch((error) => {
  logger.error("Fatal error in main execution", error);
});
