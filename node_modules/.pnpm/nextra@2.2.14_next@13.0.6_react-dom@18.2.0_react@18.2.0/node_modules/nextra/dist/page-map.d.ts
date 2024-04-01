import { a as PageMapItem, D as DynamicMetaDescriptor, F as FileMap } from './types-bb4d1162.js';
import 'next';
import 'mdast';
import '@mdx-js/mdx';
import 'rehype-pretty-code';
import 'gray-matter';
import 'webpack';
import 'react';

type PageMapProps = {
    filePath: string;
    items: PageMapItem[];
    fileMap: FileMap;
    defaultLocale: string;
};
declare function resolvePageMap({ filePath, items, fileMap, defaultLocale }: PageMapProps): {
    route: string;
    pageMap: PageMapItem[];
    dynamicMetaItems: DynamicMetaDescriptor[];
};

export { resolvePageMap };
