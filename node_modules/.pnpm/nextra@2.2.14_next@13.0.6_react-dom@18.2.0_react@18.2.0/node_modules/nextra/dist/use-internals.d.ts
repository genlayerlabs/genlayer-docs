import { d as PageOpts } from './types-bb4d1162.js';
import * as react from 'react';
import 'next';
import 'mdast';
import '@mdx-js/mdx';
import 'rehype-pretty-code';
import 'gray-matter';
import 'webpack';

/**
 * This hook is used to access the internal state of Nextra, you should never
 * use this hook in your application.
 */
declare function useInternals(): {
    context: {
        Content: react.FC<{}>;
        pageOpts: PageOpts<{
            [key: string]: any;
        }>;
        themeConfig: any;
    };
    Layout: react.FC<any>;
};

export { useInternals };
