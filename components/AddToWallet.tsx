import React, { useState, useEffect, useRef } from 'react';

interface ChainConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: string[];
}

interface WalletProvider {
  info: {
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

export default function AddToWallet({ chain }: { chain: ChainConfig }) {
  const [providers, setProviders] = useState<WalletProvider[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const discovered: WalletProvider[] = [];

    const handler = (event: any) => {
      const rdns = event.detail?.info?.rdns;
      if (rdns && !discovered.some(p => p.info.rdns === rdns)) {
        discovered.push(event.detail);
        setProviders([...discovered]);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eip6963:announceProvider', handler);
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('eip6963:announceProvider', handler);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addChain = async (walletProvider?: any) => {
    const provider = walletProvider || (typeof window !== 'undefined' && (window as any).ethereum);
    if (!provider) {
      setStatus('No wallet found');
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [chain],
      });
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chain.chainId }],
      });
      setStatus('Added');
      setIsOpen(false);
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus(err.message?.slice(0, 40) || 'Failed');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid var(--nextra-border-color, #d1d5db)',
    borderRadius: '6px',
    cursor: 'pointer',
    background: 'var(--nextra-bg, white)',
    color: 'var(--nextra-text, #374151)',
    position: 'relative',
  };

  if (status) {
    return <span style={{ ...buttonStyle, cursor: 'default' }}>{status === 'Added' ? '✓' : '✗'} {status}</span>;
  }

  if (providers.length === 0) {
    return (
      <button style={buttonStyle} onClick={() => addChain()}>
        + Add to Wallet
      </button>
    );
  }

  if (providers.length === 1) {
    return (
      <button style={buttonStyle} onClick={() => addChain(providers[0].provider)}>
        <img src={providers[0].info.icon} alt="" width={16} height={16} style={{ borderRadius: 3 }} />
        Add to {providers[0].info.name}
      </button>
    );
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button style={buttonStyle} onClick={() => setIsOpen(!isOpen)}>
        + Add to Wallet ▾
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          background: 'var(--nextra-bg, white)',
          border: '1px solid var(--nextra-border-color, #d1d5db)',
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50,
          minWidth: 180,
        }}>
          {providers.map((p, i) => (
            <button
              key={i}
              onClick={() => addChain(p.provider)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--nextra-text, #374151)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nextra-hover, #f3f4f6)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <img src={p.info.icon} alt="" width={20} height={20} style={{ borderRadius: 4 }} />
              {p.info.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
