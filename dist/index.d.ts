#!/usr/bin/env node
interface Args {
    filePath: string;
    outputPath: string;
}
export declare function generateSchema(params: Args): Promise<string>;
export {};
