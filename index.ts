import { login } from "masto";
import fs from "fs";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config()

if (!process.env.INSTANCE_URL) throw new Error("INSTANCE_URL is not defined in .env");
if (!process.env.ACCESS_TOKEN) throw new Error("ACCESS_TOKEN is not defined in .env");
if (!process.env.POSTS_DIRECTORY) throw new Error("POSTS_DIRECTORY is not defined in .env");

async function main() {
	console.log(chalk.greenBright("❯ ") + chalk.blue("Logging in to Mastodon"))
	const masto = await login({
		url: process.env.INSTANCE_URL!,
		accessToken: process.env.ACCESS_TOKEN,
		timeout: 3 * 60 * 1000,
	});
	console.log(chalk.greenBright("✓ ") + chalk.blue(`Logged in to ${process.env.INSTANCE_URL}!`))

	const files = fs.readdirSync(process.env.POSTS_DIRECTORY!, "utf-8").filter((item) => {
		return (fs.statSync(process.env.POSTS_DIRECTORY + "/" + item).size < 7900000) && (item.indexOf(".") !== 0);
	});
	const selectedFile = files[Math.floor(Math.random() * files.length)]
	const file = {
		path: process.env.POSTS_DIRECTORY + "/" + selectedFile,
		name: selectedFile,
		size: fs.statSync(process.env.POSTS_DIRECTORY + "/" + selectedFile).size
	}

	console.log(chalk.greenBright("✓ ") + chalk.blue(`Selected random file from ${process.env.POSTS_DIRECTORY}:`))
	console.log(chalk.magenta("❯ " + chalk.yellow(`Name: ${file.name}`)))
	console.log(chalk.magenta("❯ " + chalk.yellow(`Size: ${file.size / 1000} KB`)))

	console.log(chalk.greenBright("❯ ") + chalk.blue("Uploading..."))
	// Upload to Mastodon instance
	const attachment = await masto.mediaAttachments.create({
		file: fs.createReadStream(file.path),
		description: "Randomly chosen shitpost"
	});

	console.log(chalk.greenBright("✓ ") + chalk.blue("Done uploading! It's time to post!"))

	await masto.statuses.create({
		status: "Hourly #shitpost\n\n#automated",
		mediaIds: [attachment.id],
		visibility: process.env.PUBLIC ? "public" : "unlisted",
	});
	console.log(chalk.greenBright("✓ ") + chalk.blue("Toot sent! Have a nice day!"))
}

main().catch((error) => {
	if (error.statusCode == 401) throw new Error("401 Error: The access token is invalid");
	else console.error(error);
});
