import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './copy-page.module.css';
import CopyIcon from './icons/copy';
import CheckIcon from './icons/check';
import ChevronDownIcon from './icons/chevron-down';
import DocumentIcon from './icons/document';
import ChatGPTIcon from './icons/chatgpt';
import AnthropicIcon from './icons/anthropic';

const CopyPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [prefetchedContent, setPrefetchedContent] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prefetch markdown content when component mounts
  useEffect(() => {
    const prefetchContent = async () => {
      try {
        const currentPath = router.asPath;
        const cleanPath = currentPath.split('?')[0].split('#')[0];
        const mdUrl = cleanPath === '/' ? '/pages/index.md' : `/pages${cleanPath}.md`;
        
        const response = await fetch(mdUrl);
        if (response.ok) {
          const content = await response.text();
          setPrefetchedContent(content);
        }
      } catch (error) {
        console.log('Prefetch failed, will use fallback:', error);
      }
    };

    prefetchContent();
  }, [router.asPath]); // Re-prefetch when route changes

  const copyPageAsMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(prefetchedContent || '');
      
      // Show success feedback
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy page:', error);
    }
    setIsOpen(false);
  };

  const viewAsMarkdown = () => {
    const currentPath = router.asPath;
    
    // Remove query params and hash from path
    const cleanPath = currentPath.split('?')[0].split('#')[0];
    
    // Open the .md file directly (no blob needed!)
    const mdUrl = cleanPath === '/' ? '/pages/index.md' : `/pages${cleanPath}.md`;
    window.open(mdUrl, '_blank');
    setIsOpen(false);
  };

  const openInAI = (platform: 'chatgpt' | 'claude') => {
    const currentPath = router.asPath;
    const cleanPath = currentPath.split('?')[0].split('#')[0];
    
    // Use the .md file URL instead of the docs page URL
    const mdUrl = cleanPath === '/' ? '/pages/index.md' : `/pages${cleanPath}.md`;
    const fullMdUrl = `${window.location.origin}${mdUrl}`;
    
    const prompt = `I'm building with GenLayer - can you read this markdown file ${fullMdUrl} so I can ask you questions about it?`;
    const encodedPrompt = encodeURIComponent(prompt);
    
    const urls = {
      chatgpt: `https://chatgpt.com/?q=${encodedPrompt}`,
      claude: `https://claude.ai/new?q=${encodedPrompt}`
    };
    
    window.open(urls[platform], '_blank');
    setIsOpen(false);
  };

  const openInChatGPT = () => openInAI('chatgpt');
  const openInClaude = () => openInAI('claude');

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={copyPageAsMarkdown}
        className={styles.mainButton}
      >
        {isCopied ? (
          <CheckIcon className={styles.mainButtonIcon} />
        ) : (
          <CopyIcon className={styles.mainButtonIcon} />
        )}
        Copy page
      </button>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.arrowButton}
      >
        <ChevronDownIcon 
          className={`${styles.arrowIcon} ${isOpen ? styles.arrowIconRotated : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownContent}>
            <button
              onClick={copyPageAsMarkdown}
              className={styles.dropdownButton}
            >
              <CopyIcon className={styles.dropdownIcon} />
              <div className={styles.dropdownText}>
                <span className={styles.dropdownTitle}>Copy page</span>
                <span className={styles.dropdownDescription}>Copy the page as Markdown for LLMs</span>
              </div>
            </button>
            
            <button
              onClick={viewAsMarkdown}
              className={styles.dropdownButton}
            >
              <DocumentIcon className={styles.dropdownIcon} />
              <div className={styles.dropdownText}>
                <span className={styles.dropdownTitle}>View as MarkDown</span>
                <span className={styles.dropdownDescription}>View this page as plain text</span>
              </div>
            </button>
            
            <button
              onClick={openInChatGPT}
              className={styles.dropdownButton}
            >
              <ChatGPTIcon className={styles.dropdownIcon} />
              <div className={styles.dropdownText}>
                <span className={styles.dropdownTitle}>Open in ChatGPT</span>
                <span className={styles.dropdownDescription}>Ask questions about this page</span>
              </div>
            </button>
            
            <button
              onClick={openInClaude}
              className={styles.dropdownButton}
            >
              <AnthropicIcon className={styles.dropdownIcon} />
              <div className={styles.dropdownText}>
                <span className={styles.dropdownTitle}>Open in Claude</span>
                <span className={styles.dropdownDescription}>Ask questions about this page</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopyPage; 