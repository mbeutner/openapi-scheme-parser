#!/usr/bin/env node
import parser from "yargs-parser";
import { generateSchema } from "../dist/index.js";
import packageJson from '../package.json' assert { type: "json" }

const HELP = 'openapi-scheme-parser -f [filepath to spec] -o [filepath to output]'

const [, , ...args] = process.argv;
const flags = parser(args, {
	boolean: [
		"help",
		"version",
	],
	alias: {
		output: ["o"],
		filepath: ["f"],
	},
});

function main() {
	if ('help' in flags) {
		console.info(HELP)
		process.exit(0)
	}
	if ('version' in flags) {
		console.info('openapi-scheme-parser version "', packageJson.version, '"')
		process.exit(0)
	}

	let filePath
	let outputPath
	if ('f' in flags) {
		filePath = flags.f
	}
	if ('o' in flags) {
		outputPath = flags.o
	}

	if (!filePath || !outputPath) {
		if (filePath) {
			console.info('Output path name is missing')
			process.exit(0)
		}
		if (outputPath) {
			console.info('Filepath is missing')
			process.exit(0)
		}
		console.info('Filepath and output path name are missing')
		process.exit(0)
	}

	generateSchema({ filePath, outputPath })
		.then((success) => { console.info(success) })
		.catch((err) => { console.log(err) })
}
main()