import { L as LoaderOptions } from './types-bb4d1162.js';
import { LoaderContext } from 'webpack';
import 'next';
import 'mdast';
import '@mdx-js/mdx';
import 'rehype-pretty-code';
import 'gray-matter';
import 'react';

declare function syncLoader(this: LoaderContext<LoaderOptions>, source: string, callback: (err?: null | Error, content?: string | Buffer) => void): void;

export { syncLoader as default };
