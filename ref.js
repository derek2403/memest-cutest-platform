// Import necessary classes and functions from the 1inch SDK and other libraries
import {
  SDK,
  HashLock,
  PrivateKeyProviderConnector,
  NetworkEnum,
} from "@1inch/cross-chain-sdk";
import * as dotenv from "dotenv";
const process = dotenv.config().parsed;

import { Web3 } from "web3";
import {
  solidityPackedKeccak256,
  randomBytes,
  Contract,
  Wallet,
  JsonRpcProvider,
} from "ethers";

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
let dstChainId = NetworkEnum.POLYGON;
let srcTokenAddress = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"; // WETH on Arbitrum
let dstTokenAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // WETH on Polygone

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

  // Approve the source token for spending by the 1inch Aggregation Router (v6)
  const provider = new JsonRpcProvider(nodeUrl);
  const tkn = new Contract(
    srcTokenAddress,
    approveABI,
    new Wallet(makerPrivateKey, provider)
  );
  await tkn.approve(
    "0x111111125421ca6dc452d289314280a0f8842a65", // Aggregation router address
    2n ** 256n - 1n // Maximum allowance (unlimited)
  );

  // Prepare parameters to request a cross-chain swap quote
  const params = {
    srcChainId,
    dstChainId,
    srcTokenAddress,
    dstTokenAddress,
    amount: "1000000000000000",
    enableEstimate: true,
    walletAddress: makerAddress,
  };

  // Request a Fusion+ quote from the 1inch API
  sdk
    .getQuote(params)
    .then((quote) => {
      const secretsCount = quote.getPreset().secretsCount;

      // Generate an array of random secrets and their hashes
      const secrets = Array.from({ length: secretsCount }).map(() =>
        getRandomBytes32()
      );
      const secretHashes = secrets.map((x) => HashLock.hashSecret(x));

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

      console.log("Received Fusion+ quote from 1inch API");

      // Place the order on the Fusion+ protocol using the quote and hashLock
      sdk
        .placeOrder(quote, {
          walletAddress: makerAddress,
          hashLock,
          secretHashes,
        })
        .then((quoteResponse) => {
          const orderHash = quoteResponse.orderHash;

          console.log(`Order successfully placed`);

          // Start polling every 5 seconds to track the order status and fills
          const intervalId = setInterval(() => {
            console.log(
              `Polling for fills until order status is set to "executed"...`
            );

            // Check order status from the 1inch API
            sdk
              .getOrderStatus(orderHash)
              .then((order) => {
                if (order.status === "executed") {
                  console.log(`Order is complete. Exiting.`);
                  clearInterval(intervalId); // Stop polling when order is done
                }
              })
              .catch((error) =>
                console.error(`Error: ${JSON.stringify(error, null, 2)}`)
              );

            // Check if any fills are ready to accept a secret to complete execution
            sdk
              .getReadyToAcceptSecretFills(orderHash)
              .then((fillsObject) => {
                if (fillsObject.fills.length > 0) {
                  fillsObject.fills.forEach((fill) => {
                    // Submit the appropriate secret for each ready fill
                    sdk
                      .submitSecret(orderHash, secrets[fill.idx])
                      .then(() => {
                        console.log(
                          `Fill order found! Secret submitted: ${JSON.stringify(
                            secretHashes[fill.idx],
                            null,
                            2
                          )}`
                        );
                      })
                      .catch((error) => {
                        console.error(
                          `Error submitting secret: ${JSON.stringify(
                            error,
                            null,
                            2
                          )}`
                        );
                      });
                  });
                }
              })
              .catch((error) => {
                if (error.response) {
                  // Server responded with an error status
                  console.error("Error getting ready to accept secret fills:", {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                  });
                } else if (error.request) {
                  // Request was sent but no response received
                  console.error("No response received:", error.request);
                } else {
                  // Other types of errors
                  console.error("Error", error.message);
                }
              });
          }, 5000); // Polling interval
        })
        .catch((error) => {
          console.dir(error, { depth: null });
        });
    })
    .catch((error) => {
      console.dir(error, { depth: null });
    });
})().catch((error) => {
  console.error("Error in main execution:", error);
});
