import { a as PageMapItem } from './types-bb4d1162.js';
import 'next';
import 'mdast';
import '@mdx-js/mdx';
import 'rehype-pretty-code';
import 'gray-matter';
import 'webpack';
import 'react';

declare function filterRouteLocale(pageMap: PageMapItem[], locale: string, defaultLocale: string): PageMapItem[];

export { filterRouteLocale as default };
