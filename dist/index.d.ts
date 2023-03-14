#!/usr/bin/env node
interface PossibleArgs {
    filePath?: string;
    output?: string;
}
interface Args {
    filePath: string;
    outputPath: string;
}
export declare function generateSchema(params: Args): Promise<string>;
export declare function validateInputParams(args: PossibleArgs): Args;
export {};
