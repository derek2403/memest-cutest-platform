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

// Helper function for sleeping
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check balance function
async function checkBalance(web3, tokenAddress, walletAddress, requiredAmount) {
  try {
    // For ETH/Native token
    if (
      tokenAddress.toLowerCase() ===
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    ) {
      const balance = await web3.eth.getBalance(walletAddress);
      console.log(
        `Native token balance: ${web3.utils.fromWei(balance, "ether")} ETH`
      );
      console.log(
        `Required amount: ${web3.utils.fromWei(requiredAmount, "ether")} ETH`
      );
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
  } catch (error) {
    console.error(
      `Error checking balance for token ${tokenAddress}:`,
      error.message
    );
    throw new Error(`Failed to check token balance: ${error.message}`);
  }
}

// Check allowance function
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

  // Add 20% buffer to required amount to account for safety deposits
  const requiredWithBuffer =
    (BigInt(requiredAmount) * BigInt(120)) / BigInt(100);

  console.log(`Current allowance: ${allowance}`);
  console.log(`Required amount (with safety buffer): ${requiredWithBuffer}`);

  return BigInt(allowance) >= requiredWithBuffer;
}

// Check liquidity function
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

    return true;
  } catch (error) {
    console.error("Liquidity check failed:", error.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const arbitrumRpc = process.env.ARBITRUM_URL;
    const ethereumRpc = process.env.ETHEREUM_URL;
    const authKey = process.env.AUTH_KEY;
    const source = "sdk-tutorial";

    // Get parameters from request
    const { walletAddress } = req.body;

    // Initialize web3 instances for different chains
    const arbitrumWeb3 = new Web3(arbitrumRpc);
    const ethereumWeb3 = new Web3(ethereumRpc);

    // Use the appropriate web3 instance based on the source chain
    const sourceWeb3 = arbitrumWeb3;

    // Initialize SDK
    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey,
      blockchainProvider: new PrivateKeyProviderConnector(
        privateKey,
        sourceWeb3
      ),
    });

    // Set up swap parameters
    const amount = "1000000000000000"; // 0.005 ETH
    const srcToken = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"; // WETH on Arbitrum
    const dstToken = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH on Ethereum
    const INCH_ROUTER = "0x1111111254eeb25477b68fb85ed929f73a960582";

    // Perform pre-flight checks
    console.log("Performing pre-flight checks...");

    // Check balance using the source chain web3 instance
    const hasBalance = await checkBalance(
      sourceWeb3,
      srcToken,
      walletAddress,
      amount
    );
    if (!hasBalance) {
      return res.status(400).json({
        success: false,
        error: "Insufficient token balance",
      });
    }
    console.log("✅ Balance check passed");

    await sleep(1100);

    // Check allowance
    const hasAllowance = await checkAllowance(
      sourceWeb3,
      srcToken,
      walletAddress,
      INCH_ROUTER,
      amount
    );
    if (!hasAllowance) {
      return res.status(400).json({
        success: false,
        error: "Insufficient allowance for 1inch router",
      });
    }
    console.log("✅ Allowance check passed");

    await sleep(1100);

    // Check liquidity
    const hasLiquidity = await checkLiquidity(
      sdk,
      amount,
      NetworkEnum.ARBITRUM,
      NetworkEnum.ETHEREUM,
      srcToken,
      dstToken,
      walletAddress
    );
    if (!hasLiquidity) {
      return res.status(400).json({
        success: false,
        error: "Insufficient liquidity for swap",
      });
    }
    console.log("✅ Liquidity check passed");

    await sleep(1100);

    // Get quote
    const quote = await sdk.getQuote({
      amount,
      srcChainId: NetworkEnum.ARBITRUM,
      dstChainId: NetworkEnum.ETHEREUM,
      enableEstimate: true,
      srcTokenAddress: srcToken,
      dstTokenAddress: dstToken,
      walletAddress,
    });

    console.log("Quote details:", {
      srcToken: quote.params.srcToken,
      dstToken: quote.params.dstToken,
      srcAmount: quote.srcTokenAmount,
      dstAmount: quote.dstTokenAmount,
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
    console.log("Order created:", { hash, quoteId });
    console.log("Order details:", order);

    await sleep(1100);

    // Submit order
    try {
      const orderInfo = await sdk.submitOrder(
        quote.srcChainId,
        order,
        quoteId,
        secretHashes
      );
      console.log("Order submitted successfully:", orderInfo);
    } catch (error) {
      console.error("Error submitting order:", {
        message: error.message,
        response: error.response?.data,
        meta: error.response?.data?.meta,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to submit order",
        details: error.response?.data,
      });
    }

    // Start monitoring for secrets to share
    let statusResponse;

    // Submit secrets for deployed escrows
    while (true) {
      const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash);

      if (secretsToShare.fills.length) {
        for (const { idx } of secretsToShare.fills) {
          await sdk.submitSecret(hash, secrets[idx]);
          console.log({ idx }, "shared secret");
        }
      }

      // check if order finished
      statusResponse = await sdk.getOrderStatus(hash);

      if (
        statusResponse.status === OrderStatus.Executed ||
        statusResponse.status === OrderStatus.Expired ||
        statusResponse.status === OrderStatus.Refunded
      ) {
        break;
      }

      await sleep(1000);
    }

    console.log("Final status:", statusResponse);

    return res.status(200).json({
      success: true,
      orderHash: hash,
      status: statusResponse.status,
      details: statusResponse,
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
