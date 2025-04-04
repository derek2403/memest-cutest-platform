import {
  OrderStatus,
  PrivateKeyProviderConnector,
  SDK,
} from "@1inch/cross-chain-sdk";
import { Web3 } from "web3";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { orderHash } = req.query;

  if (!orderHash) {
    return res.status(400).json({
      success: false,
      error: "Missing orderHash parameter",
    });
  }

  try {
    // Get environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpc = process.env.ALCHEMY_URL;
    const authKey = process.env.AUTH_KEY;

    // Initialize Web3
    const web3 = new Web3(rpc);

    // Initialize SDK
    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey,
      blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3),
    });

    // Get order status
    const statusResponse = await sdk.getOrderStatus(orderHash);
    console.log("Order status for", orderHash, ":", statusResponse);

    // Check if there are any secrets ready to accept
    const secretsToShare = await sdk.getReadyToAcceptSecretFills(orderHash);
    console.log("Secrets to share:", secretsToShare);

    // If there are secrets to share, try to submit them
    if (secretsToShare.fills && secretsToShare.fills.length > 0) {
      // In a real implementation, you would need to retrieve the actual secrets
      // This is just placeholder logic
      console.log(
        "Found secrets to share, but need actual secret values to submit"
      );
    }

    return res.status(200).json({
      success: true,
      status: statusResponse.status,
      details: statusResponse,
    });
  } catch (error) {
    console.error("Error checking swap status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to check swap status",
      details: error.message,
    });
  }
}
