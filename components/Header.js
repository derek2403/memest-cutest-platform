import { useState, useEffect } from "react";
import { ethers } from "ethers";

const Header = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [accountAddress, setAccountAddress] = useState("");
  const [ethBalance, setEthBalance] = useState("");

  // Check if already connected on page load
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum && window.ethereum.selectedAddress) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccountAddress(accounts[0].address);

          // Get ETH balance
          const balance = await provider.getBalance(accounts[0].address);
          setEthBalance(ethers.formatEther(balance).substring(0, 6));
        }
      }
    }
    checkConnection();
  }, []);

  async function connectToMainnet() {
    try {
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        // Try to switch to Arbitrum One
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xA4B1" }], // Arbitrum chainId in hex
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xA4B1",
                  chainName: "Arbitrum One",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
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
          } else {
            throw switchError;
          }
        }

        setIsConnected(true);
        setAccountAddress(accounts[0]);

        // Get ETH balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(accounts[0]);
        setEthBalance(ethers.formatEther(balance).substring(0, 6));
      } else {
        alert("Please install MetaMask to use this app");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  }

  return (
    <header className="flex items-center justify-between w-full px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Cross-Chain Swap</h1>
      </div>
      <div>
        {!isConnected ? (
          <button
            onClick={connectToMainnet}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Connect to Arbitrum
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {ethBalance} ETH
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="font-medium">
                {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
