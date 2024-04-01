import { FC } from 'react';
import { b as Folder, c as DynamicMetaJsonFile, d as PageOpts, T as ThemeConfig, D as DynamicMetaDescriptor } from './types-bb4d1162.js';
import 'next';
import 'mdast';
import '@mdx-js/mdx';
import 'rehype-pretty-code';
import 'gray-matter';
import 'webpack';

declare function collectCatchAllRoutes(parent: Folder<any>, meta: DynamicMetaJsonFile, isRootFolder?: boolean): void;
declare function setupNextraPage({ pageNextRoute, pageOpts, nextraLayout, themeConfig, Content, hot, pageOptsChecksum, dynamicMetaModules }: {
    pageNextRoute: string;
    pageOpts: PageOpts;
    nextraLayout: FC;
    themeConfig: ThemeConfig;
    Content: FC;
    hot: __WebpackModuleApi.Hot;
    pageOptsChecksum: string;
    dynamicMetaModules: [Promise<any>, DynamicMetaDescriptor][];
}): void;

export { collectCatchAllRoutes, setupNextraPage };
