import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  return (
    <header className="flex items-center justify-between w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Memest Cutest Platform</h1>
      </div>
      <ConnectButton />
    </header>
  );
};

export default Header; 