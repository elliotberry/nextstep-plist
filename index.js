#!/usr/bin/env node
import { EOL } from "node:os";
import parse from "./lib/parse.js";
import stringify from "./lib/stringify.js";

async function getStdin() {
	return new Promise((resolve, reject) => {
		let result = "";
		process.stdin.setEncoding("utf8");

		process.stdin.on("data", chunk => {
			result += chunk;
		});

		process.stdin.on("end", () => resolve(result));
		process.stdin.on("error", reject);
	});
}

const help = `
commands:
	to-json  — take stdin as a plist and output JSON
	to-plist — take stdin as JSON and output plist
`;

(async function main() {
	if (!module.parent) {
		try {
			const command = process.argv[2];
			const input = await getStdin();

			switch (command) {
				case "to-json": {
					const object = parse(input);
					const output = JSON.stringify(object, null, "\t");
					process.stdout.write(output + EOL);
					break;
				}
				case "to-plist": {
					const object = JSON.parse(input);
					const output = stringify(object);
					process.stdout.write(output + EOL);
					break;
				}
				default: {
					process.stdout.write(help);
					process.exitCode = 1;
				}
			}
		} catch (error) {
			console.error(process.env.debug ? error : error.message);
		}
	}
})();

export { parse, stringify };
