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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const copyPageAsMarkdown = async () => {
    try {
      // Get the current page content
      const pageContent = document.querySelector('main')?.innerText || '';
      const pageTitle = document.title;
      
      // Create markdown content
      const markdownContent = `# ${pageTitle}\n\n${pageContent}`;
      
      await navigator.clipboard.writeText(markdownContent);
      
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
    const pageContent = document.querySelector('main')?.innerText || '';
    const pageTitle = document.title;
    const markdownContent = `# ${pageTitle}\n\n${pageContent}`;
    
    // Open in new window/tab
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const openInAI = (platform: 'chatgpt' | 'claude') => {
    const currentUrl = window.location.href;
    const prompt = `I'm building with GenLayer - can you read this docs page ${currentUrl} so I can ask you questions about it?`;
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
              data-copy-feedback
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