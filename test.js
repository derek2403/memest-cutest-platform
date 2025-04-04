const { Web3 } = require("web3");
const dotenv = require("dotenv");

dotenv.config();

console.log("Environment variables loaded:");
console.log("ALCHEMY_URL:", process.env.ALCHEMY_URL ? "✓ Found" : "✗ Missing");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✓ Found" : "✗ Missing");

if (process.env.PRIVATE_KEY) {
  const pkFormat = process.env.PRIVATE_KEY.startsWith("0x")
    ? "Has 0x prefix"
    : "Missing 0x prefix";
  console.log("PRIVATE_KEY format:", pkFormat);
  console.log("PRIVATE_KEY length:", process.env.PRIVATE_KEY.length);
}

const privateKey = process.env.PRIVATE_KEY;
const rpc = process.env.ALCHEMY_URL;

try {
  const web3 = new Web3(rpc);
  const walletAddress =
    web3.eth.accounts.privateKeyToAccount(privateKey).address;
  console.log("Successfully created wallet address:", walletAddress);
} catch (error) {
  console.error("Error initializing Web3:", error.message);
  console.error("Full error:", error);
}
