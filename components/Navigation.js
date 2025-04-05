import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navigation() {
  const router = useRouter();
  
  const links = [
    { href: '/', label: 'Home' },
    { href: '/mcptest', label: 'MCP Test' },
    { href: '/test', label: 'Workflow Test' },
    { href: '/counter-events', label: 'Counter Events' },
  ];
  
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex space-x-4">
          {links.map((link) => {
            const isActive = router.pathname === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 