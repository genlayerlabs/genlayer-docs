import { MdxFile, Folder, Heading, FrontMatter, PageOpts, NextraThemeLayoutProps } from 'nextra';
import * as react from 'react';
import { ReactElement, ReactNode, FC, ComponentProps } from 'react';
import { z } from 'zod';
import { NextSeoProps } from 'next-seo';
export { useMDXComponents } from 'nextra/mdx';
export { useTheme } from 'next-themes';

type FolderWithoutChildren = Omit<Folder, 'children'>;
type Item = (MdxFile | FolderWithoutChildren) & {
    title: string;
    type: string;
    children?: Item[];
    display?: Display;
    withIndexPage?: boolean;
    theme?: PageTheme;
    isUnderCurrentDocsTree?: boolean;
};
type PageItem = (MdxFile | FolderWithoutChildren) & {
    title: string;
    type: string;
    href?: string;
    newWindow?: boolean;
    children?: PageItem[];
    firstChildRoute?: string;
    display?: Display;
    withIndexPage?: boolean;
    isUnderCurrentDocsTree?: boolean;
};
type MenuItem = (MdxFile | FolderWithoutChildren) & IMenuItem & {
    children?: PageItem[];
};

type NavBarProps = {
    flatDirectories: Item[];
    items: (PageItem | MenuItem)[];
};
declare function Navbar({ flatDirectories, items }: NavBarProps): ReactElement;

type TOCProps = {
    headings: Heading[];
    filePath: string;
};

declare const themeSchema: z.ZodObject<{
    banner: z.ZodObject<{
        dismissible: z.ZodBoolean;
        key: z.ZodString;
        text: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
    }, "strict", z.ZodTypeAny, {
        text?: ReactNode | FC<{}>;
        dismissible: boolean;
        key: string;
    }, {
        text?: ReactNode | FC<{}>;
        dismissible: boolean;
        key: string;
    }>;
    chat: z.ZodObject<{
        icon: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
        link: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }>;
    components: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<FC<{}>, z.ZodTypeDef, FC<{}>>>>;
    darkMode: z.ZodBoolean;
    direction: z.ZodEnum<["ltr", "rtl"]>;
    docsRepositoryBase: z.ZodString;
    editLink: z.ZodObject<{
        component: z.ZodType<FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>, z.ZodTypeDef, FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>>;
        text: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
    }, "strict", z.ZodTypeAny, {
        text?: ReactNode | FC<{}>;
        component: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>;
    }, {
        text?: ReactNode | FC<{}>;
        component: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>;
    }>;
    faviconGlyph: z.ZodOptional<z.ZodString>;
    feedback: z.ZodObject<{
        content: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
        labels: z.ZodString;
        useLink: z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        content?: ReactNode | FC<{}>;
        labels: string;
        useLink: (...args: unknown[]) => string;
    }, {
        content?: ReactNode | FC<{}>;
        labels: string;
        useLink: (...args: unknown[]) => string;
    }>;
    footer: z.ZodObject<{
        component: z.ZodType<ReactNode | FC<{
            menu: boolean;
        }>, z.ZodTypeDef, ReactNode | FC<{
            menu: boolean;
        }>>;
        text: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
    }, "strict", z.ZodTypeAny, {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    }, {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    }>;
    gitTimestamp: z.ZodType<ReactNode | FC<{
        timestamp: Date;
    }>, z.ZodTypeDef, ReactNode | FC<{
        timestamp: Date;
    }>>;
    head: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
    i18n: z.ZodArray<z.ZodObject<{
        direction: z.ZodOptional<z.ZodEnum<["ltr", "rtl"]>>;
        locale: z.ZodString;
        text: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }, {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }>, "many">;
    logo: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
    logoLink: z.ZodUnion<[z.ZodBoolean, z.ZodString]>;
    main: z.ZodOptional<z.ZodType<FC<{
        children: ReactNode;
    }>, z.ZodTypeDef, FC<{
        children: ReactNode;
    }>>>;
    navbar: z.ZodObject<{
        component: z.ZodType<ReactNode | FC<NavBarProps>, z.ZodTypeDef, ReactNode | FC<NavBarProps>>;
        extraContent: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
    }, "strict", z.ZodTypeAny, {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    }, {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    }>;
    navigation: z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        next: z.ZodBoolean;
        prev: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        next: boolean;
        prev: boolean;
    }, {
        next: boolean;
        prev: boolean;
    }>]>;
    nextThemes: z.ZodObject<{
        defaultTheme: z.ZodString;
        forcedTheme: z.ZodOptional<z.ZodString>;
        storageKey: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        forcedTheme?: string | undefined;
        defaultTheme: string;
        storageKey: string;
    }, {
        forcedTheme?: string | undefined;
        defaultTheme: string;
        storageKey: string;
    }>;
    notFound: z.ZodObject<{
        content: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
        labels: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        content?: ReactNode | FC<{}>;
        labels: string;
    }, {
        content?: ReactNode | FC<{}>;
        labels: string;
    }>;
    primaryHue: z.ZodUnion<[z.ZodNumber, z.ZodObject<{
        dark: z.ZodNumber;
        light: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        dark: number;
        light: number;
    }, {
        dark: number;
        light: number;
    }>]>;
    project: z.ZodObject<{
        icon: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
        link: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }>;
    search: z.ZodObject<{
        component: z.ZodType<ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>, z.ZodTypeDef, ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>>;
        emptyResult: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
        error: z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>]>;
        loading: z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>]>;
        placeholder: z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>]>;
    }, "strict", z.ZodTypeAny, {
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        error: string | ((...args: unknown[]) => string);
        loading: string | ((...args: unknown[]) => string);
        placeholder: string | ((...args: unknown[]) => string);
    }, {
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        error: string | ((...args: unknown[]) => string);
        loading: string | ((...args: unknown[]) => string);
        placeholder: string | ((...args: unknown[]) => string);
    }>;
    serverSideError: z.ZodObject<{
        content: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
        labels: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        content?: ReactNode | FC<{}>;
        labels: string;
    }, {
        content?: ReactNode | FC<{}>;
        labels: string;
    }>;
    sidebar: z.ZodObject<{
        defaultMenuCollapseLevel: z.ZodNumber;
        titleComponent: z.ZodType<ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>, z.ZodTypeDef, ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>>;
        toggleButton: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        defaultMenuCollapseLevel: number;
        toggleButton: boolean;
    }, {
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        defaultMenuCollapseLevel: number;
        toggleButton: boolean;
    }>;
    toc: z.ZodObject<{
        component: z.ZodType<ReactNode | FC<TOCProps>, z.ZodTypeDef, ReactNode | FC<TOCProps>>;
        extraContent: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
        float: z.ZodBoolean;
        title: z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>;
    }, "strict", z.ZodTypeAny, {
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
        float: boolean;
    }, {
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
        float: boolean;
    }>;
    useNextSeoProps: z.ZodType<() => NextSeoProps, z.ZodTypeDef, () => NextSeoProps>;
}, "strict", z.ZodTypeAny, {
    components?: Record<string, FC<{}>> | undefined;
    faviconGlyph?: string | undefined;
    gitTimestamp?: ReactNode | FC<{
        timestamp: Date;
    }>;
    head?: ReactNode | FC<{}>;
    logo?: ReactNode | FC<{}>;
    main?: FC<{
        children: ReactNode;
    }> | undefined;
    footer: {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    };
    navbar: {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    };
    sidebar: {
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        defaultMenuCollapseLevel: number;
        toggleButton: boolean;
    };
    toc: {
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
        float: boolean;
    };
    navigation: boolean | {
        next: boolean;
        prev: boolean;
    };
    banner: {
        text?: ReactNode | FC<{}>;
        dismissible: boolean;
        key: string;
    };
    chat: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    };
    darkMode: boolean;
    direction: "ltr" | "rtl";
    docsRepositoryBase: string;
    editLink: {
        text?: ReactNode | FC<{}>;
        component: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>;
    };
    feedback: {
        content?: ReactNode | FC<{}>;
        labels: string;
        useLink: (...args: unknown[]) => string;
    };
    i18n: {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }[];
    logoLink: string | boolean;
    nextThemes: {
        forcedTheme?: string | undefined;
        defaultTheme: string;
        storageKey: string;
    };
    notFound: {
        content?: ReactNode | FC<{}>;
        labels: string;
    };
    primaryHue: number | {
        dark: number;
        light: number;
    };
    project: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    };
    search: {
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        error: string | ((...args: unknown[]) => string);
        loading: string | ((...args: unknown[]) => string);
        placeholder: string | ((...args: unknown[]) => string);
    };
    serverSideError: {
        content?: ReactNode | FC<{}>;
        labels: string;
    };
    useNextSeoProps: () => NextSeoProps;
}, {
    components?: Record<string, FC<{}>> | undefined;
    faviconGlyph?: string | undefined;
    gitTimestamp?: ReactNode | FC<{
        timestamp: Date;
    }>;
    head?: ReactNode | FC<{}>;
    logo?: ReactNode | FC<{}>;
    main?: FC<{
        children: ReactNode;
    }> | undefined;
    footer: {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    };
    navbar: {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    };
    sidebar: {
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        defaultMenuCollapseLevel: number;
        toggleButton: boolean;
    };
    toc: {
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
        float: boolean;
    };
    navigation: boolean | {
        next: boolean;
        prev: boolean;
    };
    banner: {
        text?: ReactNode | FC<{}>;
        dismissible: boolean;
        key: string;
    };
    chat: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    };
    darkMode: boolean;
    direction: "ltr" | "rtl";
    docsRepositoryBase: string;
    editLink: {
        text?: ReactNode | FC<{}>;
        component: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>;
    };
    feedback: {
        content?: ReactNode | FC<{}>;
        labels: string;
        useLink: (...args: unknown[]) => string;
    };
    i18n: {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }[];
    logoLink: string | boolean;
    nextThemes: {
        forcedTheme?: string | undefined;
        defaultTheme: string;
        storageKey: string;
    };
    notFound: {
        content?: ReactNode | FC<{}>;
        labels: string;
    };
    primaryHue: number | {
        dark: number;
        light: number;
    };
    project: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    };
    search: {
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        error: string | ((...args: unknown[]) => string);
        loading: string | ((...args: unknown[]) => string);
        placeholder: string | ((...args: unknown[]) => string);
    };
    serverSideError: {
        content?: ReactNode | FC<{}>;
        labels: string;
    };
    useNextSeoProps: () => NextSeoProps;
}>;
declare const publicThemeSchema: z.ZodObject<z.extendShape<{
    banner: z.ZodOptional<z.ZodObject<{
        dismissible: z.ZodOptional<z.ZodBoolean>;
        key: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>>;
    }, "strict", z.ZodTypeAny, {
        dismissible?: boolean | undefined;
        key?: string | undefined;
        text?: ReactNode | FC<{}>;
    }, {
        dismissible?: boolean | undefined;
        key?: string | undefined;
        text?: ReactNode | FC<{}>;
    }>>;
    chat: z.ZodOptional<z.ZodObject<{
        icon: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
        link: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }>>;
    components: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<FC<{}>, z.ZodTypeDef, FC<{}>>>>>;
    darkMode: z.ZodOptional<z.ZodBoolean>;
    direction: z.ZodOptional<z.ZodEnum<["ltr", "rtl"]>>;
    docsRepositoryBase: z.ZodOptional<z.ZodString>;
    editLink: z.ZodOptional<z.ZodObject<{
        component: z.ZodOptional<z.ZodType<FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>, z.ZodTypeDef, FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }>>>;
        text: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
    }, "strict", z.ZodTypeAny, {
        text?: ReactNode | FC<{}>;
        component?: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }> | undefined;
    }, {
        text?: ReactNode | FC<{}>;
        component?: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }> | undefined;
    }>>;
    faviconGlyph: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    feedback: z.ZodOptional<z.ZodObject<{
        content: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
        labels: z.ZodOptional<z.ZodString>;
        useLink: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
        useLink?: ((...args: unknown[]) => string) | undefined;
    }, {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
        useLink?: ((...args: unknown[]) => string) | undefined;
    }>>;
    footer: z.ZodOptional<z.ZodObject<{
        component: z.ZodOptional<z.ZodType<ReactNode | FC<{
            menu: boolean;
        }>, z.ZodTypeDef, ReactNode | FC<{
            menu: boolean;
        }>>>;
        text: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
    }, "strict", z.ZodTypeAny, {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    }, {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    }>>;
    gitTimestamp: z.ZodOptional<z.ZodType<ReactNode | FC<{
        timestamp: Date;
    }>, z.ZodTypeDef, ReactNode | FC<{
        timestamp: Date;
    }>>>;
    head: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
    i18n: z.ZodOptional<z.ZodArray<z.ZodObject<{
        direction: z.ZodOptional<z.ZodOptional<z.ZodEnum<["ltr", "rtl"]>>>;
        locale: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        text?: string | undefined;
        direction?: "ltr" | "rtl" | undefined;
        locale?: string | undefined;
    }, {
        text?: string | undefined;
        direction?: "ltr" | "rtl" | undefined;
        locale?: string | undefined;
    }>, "many">>;
    logo: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
    logoLink: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    main: z.ZodOptional<z.ZodOptional<z.ZodType<FC<{
        children: ReactNode;
    }>, z.ZodTypeDef, FC<{
        children: ReactNode;
    }>>>>;
    navbar: z.ZodOptional<z.ZodObject<{
        component: z.ZodOptional<z.ZodType<ReactNode | FC<NavBarProps>, z.ZodTypeDef, ReactNode | FC<NavBarProps>>>;
        extraContent: z.ZodOptional<z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>>;
    }, "strict", z.ZodTypeAny, {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    }, {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    }>>;
    navigation: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        next: z.ZodBoolean;
        prev: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        next: boolean;
        prev: boolean;
    }, {
        next: boolean;
        prev: boolean;
    }>]>>;
    nextThemes: z.ZodOptional<z.ZodObject<{
        defaultTheme: z.ZodOptional<z.ZodString>;
        forcedTheme: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        storageKey: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        defaultTheme?: string | undefined;
        forcedTheme?: string | undefined;
        storageKey?: string | undefined;
    }, {
        defaultTheme?: string | undefined;
        forcedTheme?: string | undefined;
        storageKey?: string | undefined;
    }>>;
    notFound: z.ZodOptional<z.ZodObject<{
        content: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
        labels: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    }, {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    }>>;
    primaryHue: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodObject<{
        dark: z.ZodNumber;
        light: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        dark: number;
        light: number;
    }, {
        dark: number;
        light: number;
    }>]>>;
    project: z.ZodOptional<z.ZodObject<{
        icon: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
        link: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }, {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    }>>;
    search: z.ZodOptional<z.ZodObject<{
        component: z.ZodOptional<z.ZodType<ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>, z.ZodTypeDef, ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>>>;
        emptyResult: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
        error: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>]>>;
        loading: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>]>>;
        placeholder: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodString>]>>;
    }, "strict", z.ZodTypeAny, {
        error?: string | ((...args: unknown[]) => string) | undefined;
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        loading?: string | ((...args: unknown[]) => string) | undefined;
        placeholder?: string | ((...args: unknown[]) => string) | undefined;
    }, {
        error?: string | ((...args: unknown[]) => string) | undefined;
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        loading?: string | ((...args: unknown[]) => string) | undefined;
        placeholder?: string | ((...args: unknown[]) => string) | undefined;
    }>>;
    serverSideError: z.ZodOptional<z.ZodObject<{
        content: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
        labels: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    }, {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    }>>;
    sidebar: z.ZodOptional<z.ZodObject<{
        defaultMenuCollapseLevel: z.ZodOptional<z.ZodNumber>;
        titleComponent: z.ZodOptional<z.ZodType<ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>, z.ZodTypeDef, ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>>>;
        toggleButton: z.ZodOptional<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        defaultMenuCollapseLevel?: number | undefined;
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        toggleButton?: boolean | undefined;
    }, {
        defaultMenuCollapseLevel?: number | undefined;
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        toggleButton?: boolean | undefined;
    }>>;
    toc: z.ZodOptional<z.ZodObject<{
        component: z.ZodOptional<z.ZodType<ReactNode | FC<TOCProps>, z.ZodTypeDef, ReactNode | FC<TOCProps>>>;
        extraContent: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
        float: z.ZodOptional<z.ZodBoolean>;
        title: z.ZodOptional<z.ZodType<ReactNode | FC<{}>, z.ZodTypeDef, ReactNode | FC<{}>>>;
    }, "strict", z.ZodTypeAny, {
        float?: boolean | undefined;
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
    }, {
        float?: boolean | undefined;
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
    }>>;
    useNextSeoProps: z.ZodOptional<z.ZodType<() => NextSeoProps, z.ZodTypeDef, () => NextSeoProps>>;
}, {
    i18n: z.ZodOptional<z.ZodArray<z.ZodObject<{
        direction: z.ZodOptional<z.ZodEnum<["ltr", "rtl"]>>;
        locale: z.ZodString;
        text: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }, {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }>, "many">>;
}>, "strict", z.ZodTypeAny, {
    footer?: {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    } | undefined;
    navbar?: {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    } | undefined;
    sidebar?: {
        defaultMenuCollapseLevel?: number | undefined;
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        toggleButton?: boolean | undefined;
    } | undefined;
    toc?: {
        float?: boolean | undefined;
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
    } | undefined;
    navigation?: boolean | {
        next: boolean;
        prev: boolean;
    } | undefined;
    banner?: {
        dismissible?: boolean | undefined;
        key?: string | undefined;
        text?: ReactNode | FC<{}>;
    } | undefined;
    chat?: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    } | undefined;
    components?: Record<string, FC<{}>> | undefined;
    darkMode?: boolean | undefined;
    direction?: "ltr" | "rtl" | undefined;
    docsRepositoryBase?: string | undefined;
    editLink?: {
        text?: ReactNode | FC<{}>;
        component?: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }> | undefined;
    } | undefined;
    faviconGlyph?: string | undefined;
    feedback?: {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
        useLink?: ((...args: unknown[]) => string) | undefined;
    } | undefined;
    gitTimestamp?: ReactNode | FC<{
        timestamp: Date;
    }>;
    head?: ReactNode | FC<{}>;
    i18n?: {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }[] | undefined;
    logo?: ReactNode | FC<{}>;
    logoLink?: string | boolean | undefined;
    main?: FC<{
        children: ReactNode;
    }> | undefined;
    nextThemes?: {
        defaultTheme?: string | undefined;
        forcedTheme?: string | undefined;
        storageKey?: string | undefined;
    } | undefined;
    notFound?: {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    } | undefined;
    primaryHue?: number | {
        dark: number;
        light: number;
    } | undefined;
    project?: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    } | undefined;
    search?: {
        error?: string | ((...args: unknown[]) => string) | undefined;
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        loading?: string | ((...args: unknown[]) => string) | undefined;
        placeholder?: string | ((...args: unknown[]) => string) | undefined;
    } | undefined;
    serverSideError?: {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    } | undefined;
    useNextSeoProps?: (() => NextSeoProps) | undefined;
}, {
    footer?: {
        text?: ReactNode | FC<{}>;
        component?: ReactNode | FC<{
            menu: boolean;
        }>;
    } | undefined;
    navbar?: {
        component?: ReactNode | FC<NavBarProps>;
        extraContent?: ReactNode | FC<{}>;
    } | undefined;
    sidebar?: {
        defaultMenuCollapseLevel?: number | undefined;
        titleComponent?: ReactNode | FC<{
            title: string;
            type: string;
            route: string;
        }>;
        toggleButton?: boolean | undefined;
    } | undefined;
    toc?: {
        float?: boolean | undefined;
        component?: ReactNode | FC<TOCProps>;
        extraContent?: ReactNode | FC<{}>;
        title?: ReactNode | FC<{}>;
    } | undefined;
    navigation?: boolean | {
        next: boolean;
        prev: boolean;
    } | undefined;
    banner?: {
        dismissible?: boolean | undefined;
        key?: string | undefined;
        text?: ReactNode | FC<{}>;
    } | undefined;
    chat?: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    } | undefined;
    components?: Record<string, FC<{}>> | undefined;
    darkMode?: boolean | undefined;
    direction?: "ltr" | "rtl" | undefined;
    docsRepositoryBase?: string | undefined;
    editLink?: {
        text?: ReactNode | FC<{}>;
        component?: FC<{
            children: ReactNode;
            className?: string | undefined;
            filePath?: string | undefined;
        }> | undefined;
    } | undefined;
    faviconGlyph?: string | undefined;
    feedback?: {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
        useLink?: ((...args: unknown[]) => string) | undefined;
    } | undefined;
    gitTimestamp?: ReactNode | FC<{
        timestamp: Date;
    }>;
    head?: ReactNode | FC<{}>;
    i18n?: {
        direction?: "ltr" | "rtl" | undefined;
        text: string;
        locale: string;
    }[] | undefined;
    logo?: ReactNode | FC<{}>;
    logoLink?: string | boolean | undefined;
    main?: FC<{
        children: ReactNode;
    }> | undefined;
    nextThemes?: {
        defaultTheme?: string | undefined;
        forcedTheme?: string | undefined;
        storageKey?: string | undefined;
    } | undefined;
    notFound?: {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    } | undefined;
    primaryHue?: number | {
        dark: number;
        light: number;
    } | undefined;
    project?: {
        icon?: ReactNode | FC<{}>;
        link?: string | undefined;
    } | undefined;
    search?: {
        error?: string | ((...args: unknown[]) => string) | undefined;
        component?: ReactNode | FC<{
            className?: string | undefined;
            directories: Item[];
        }>;
        emptyResult?: ReactNode | FC<{}>;
        loading?: string | ((...args: unknown[]) => string) | undefined;
        placeholder?: string | ((...args: unknown[]) => string) | undefined;
    } | undefined;
    serverSideError?: {
        content?: ReactNode | FC<{}>;
        labels?: string | undefined;
    } | undefined;
    useNextSeoProps?: (() => NextSeoProps) | undefined;
}>;
type DocsThemeConfig = z.infer<typeof themeSchema>;
type PartialDocsThemeConfig = z.infer<typeof publicThemeSchema>;
declare const pageThemeSchema: z.ZodObject<{
    breadcrumb: z.ZodBoolean;
    collapsed: z.ZodBoolean;
    footer: z.ZodBoolean;
    layout: z.ZodEnum<["default", "full", "raw"]>;
    navbar: z.ZodBoolean;
    pagination: z.ZodBoolean;
    sidebar: z.ZodBoolean;
    timestamp: z.ZodBoolean;
    toc: z.ZodBoolean;
    typesetting: z.ZodEnum<["default", "article"]>;
}, "strict", z.ZodTypeAny, {
    breadcrumb: boolean;
    collapsed: boolean;
    footer: boolean;
    layout: "default" | "full" | "raw";
    navbar: boolean;
    pagination: boolean;
    sidebar: boolean;
    timestamp: boolean;
    toc: boolean;
    typesetting: "default" | "article";
}, {
    breadcrumb: boolean;
    collapsed: boolean;
    footer: boolean;
    layout: "default" | "full" | "raw";
    navbar: boolean;
    pagination: boolean;
    sidebar: boolean;
    timestamp: boolean;
    toc: boolean;
    typesetting: "default" | "article";
}>;
type PageTheme = z.infer<typeof pageThemeSchema>;
/**
 * An option to control how an item should be displayed in the sidebar:
 * - `normal`: the default behavior, item will be displayed
 * - `hidden`: the item will not be displayed in the sidebar entirely
 * - `children`: if the item is a folder, itself will be hidden but all its children will still be processed
 */
declare const displaySchema: z.ZodEnum<["normal", "hidden", "children"]>;
declare const menuItemSchema: z.ZodObject<{
    display: z.ZodOptional<z.ZodEnum<["normal", "hidden", "children"]>>;
    items: z.ZodRecord<z.ZodString, z.ZodObject<{
        title: z.ZodString;
        href: z.ZodOptional<z.ZodString>;
        newWindow: z.ZodOptional<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        href?: string | undefined;
        newWindow?: boolean | undefined;
        title: string;
    }, {
        href?: string | undefined;
        newWindow?: boolean | undefined;
        title: string;
    }>>;
    title: z.ZodString;
    type: z.ZodLiteral<"menu">;
}, "strict", z.ZodTypeAny, {
    display?: "children" | "normal" | "hidden" | undefined;
    type: "menu";
    title: string;
    items: Record<string, {
        href?: string | undefined;
        newWindow?: boolean | undefined;
        title: string;
    }>;
}, {
    display?: "children" | "normal" | "hidden" | undefined;
    type: "menu";
    title: string;
    items: Record<string, {
        href?: string | undefined;
        newWindow?: boolean | undefined;
        title: string;
    }>;
}>;
type Display = z.infer<typeof displaySchema>;
type IMenuItem = z.infer<typeof menuItemSchema>;

type Config<FrontMatterType = FrontMatter> = DocsThemeConfig & Pick<PageOpts<FrontMatterType>, 'flexsearch' | 'newNextLinkBehavior' | 'title' | 'frontMatter'>;
declare function useConfig<FrontMatterType = FrontMatter>(): Config<FrontMatterType>;

declare function Bleed({ full, children }: {
    full: boolean;
    children: ReactNode;
}): ReactElement;

declare const TypeToEmoji: {
    default: string;
    error: string;
    info: JSX.Element;
    warning: string;
};
type CalloutType = keyof typeof TypeToEmoji;
type CalloutProps = {
    type?: CalloutType;
    emoji?: string | ReactElement;
    children: ReactNode;
};
declare function Callout({ children, type, emoji }: CalloutProps): ReactElement;

declare function Collapse({ children, className, isOpen, horizontal }: {
    children: ReactNode;
    className?: string;
    isOpen: boolean;
    horizontal?: boolean;
}): ReactElement;

declare function NotFoundPage(): ReactElement | null;

declare function ServerSideErrorPage(): ReactElement | null;

declare const SkipNavLink: react.ForwardRefExoticComponent<Omit<react.DetailedHTMLProps<react.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, "children" | "ref" | "href"> & {
    label?: string | undefined;
    styled?: boolean | undefined;
} & react.RefAttributes<HTMLAnchorElement>>;
type SkipNavContentProps = Omit<ComponentProps<'div'>, 'ref' | 'children'>;
declare const SkipNavContent: react.ForwardRefExoticComponent<SkipNavContentProps & react.RefAttributes<HTMLDivElement>>;

type TabItem = {
    label: ReactElement;
    disabled?: boolean;
};
declare function Tabs({ items, selectedIndex, defaultIndex, onChange, children }: {
    items: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[];
    selectedIndex?: number;
    defaultIndex?: number;
    onChange?: (index: number) => void;
    children: ReactNode;
}): ReactElement;
declare function Tab({ children, ...props }: ComponentProps<'div'>): ReactElement;

type ThemeSwitchProps = {
    lite?: boolean;
    className?: string;
};
declare function ThemeSwitch({ lite, className }: ThemeSwitchProps): ReactElement;

declare function Layout({ children, ...context }: NextraThemeLayoutProps): ReactElement;

export { Bleed, Callout, Collapse, PartialDocsThemeConfig as DocsThemeConfig, Navbar, NotFoundPage, ServerSideErrorPage, SkipNavContent, SkipNavLink, Tab, Tabs, ThemeSwitch, Layout as default, useConfig };
