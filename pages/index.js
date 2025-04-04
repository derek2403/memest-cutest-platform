import { useState, useEffect } from "react";
import Header from "../components/Header";
import { ethers } from "ethers";

export default function Home() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [txHash, setTxHash] = useState("");

  // Check if already connected on page load
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum && window.ethereum.selectedAddress) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const network = await provider.getNetwork();
          setAccount(accounts[0].address);
          setChainId(Number(network.chainId));
          setStatus("Connected");
        }
      }
    }
    checkConnection();
  }, []);

  // Connect to MetaMask
  async function connectWallet() {
    try {
      setStatus("Connecting...");
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();

        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setStatus("Connected");
      } else {
        setStatus("MetaMask not installed");
        alert("Please install MetaMask to use this app");
      }
    } catch (error) {
      console.error(error);
      setStatus("Connection failed");
    }
  }

  // Execute the cross-chain swap
  async function executeSwap() {
    try {
      console.log("🚀 Starting swap process...");
      setStatus("Preparing swap...");

      // Switch to Arbitrum if not already on it
      if (chainId !== 42161) {
        console.log("⚠️ Not on Arbitrum, switching networks...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xA4B1" }], // Arbitrum chainId in hex
          });

          // Wait for the network to switch and update chainId
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));

          console.log("✅ Successfully switched to Arbitrum");
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xA4B1",
                    chainName: "Arbitrum One",
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
                    blockExplorerUrls: ["https://arbiscan.io/"],
                  },
                ],
              });
              // Try switching again after adding
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xA4B1" }],
              });
            } catch (addError) {
              throw new Error("Failed to add Arbitrum network to MetaMask");
            }
          } else {
            throw new Error("Failed to switch to Arbitrum network");
          }
        }
      }

      // Get the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("✅ Got signer from provider");

      setStatus("Preparing swap with native ETH...");
      console.log("📡 Calling API to execute swap...");

      // Increased amount from 0.001 to 0.01 ETH
      const amount = "10000000000000000"; // 0.01 ETH
      console.log(
        `💰 Preparing swap with amount: ${ethers.formatEther(amount)} ETH/WETH`
      );

      // Call the API to execute the swap
      const response = await fetch("/api/executeSwap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: account,
          useNativeEth: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      console.log("📡 API response received");
      const data = await response.json();
      console.log("📊 API response data:", data);

      if (data.success) {
        console.log(`🎉 Swap executed! Status: ${data.status}`);
        setStatus(`Swap executed! Status: ${data.status}`);
        setTxHash(data.orderHash);
      } else {
        console.error("❌ Swap failed:", data.error, data.details);
        throw new Error(data.error || "Swap failed");
      }
    } catch (error) {
      console.error("❌ Swap execution error:", error);
      setStatus("Swap failed: " + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Cross-Chain Swap
          </h1>

          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Status: <span className="font-medium">{status}</span>
            </p>
            {account && (
              <p className="text-gray-700 mb-2">
                Connected Account:{" "}
                <span className="font-medium">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </p>
            )}
            {chainId && (
              <p className="text-gray-700 mb-2">
                Chain ID: <span className="font-medium">{chainId}</span>
              </p>
            )}
          </div>

          <div className="space-y-4">
            {!account ? (
              <button
                onClick={connectWallet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={executeSwap}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Approve & Prepare Swap
              </button>
            )}
          </div>

          {txHash && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-700">Transaction Hash:</p>
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 break-all text-sm"
              >
                {txHash}
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
