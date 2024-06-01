import { App, stringifyYaml } from "obsidian";
import { extractPos } from "utils/extractPos";

export const TASK_STATUS = {
	Open: " ",
	Done: "x",
} as const;
export type TASK_STATUS_ENUM = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

interface ListItem {
	date?: Date;
	task?: TASK_STATUS_ENUM;
	description: string;
}

interface Contact {
	name: string;
	email: string;
	phone: string;
	image: string;
	events: string[];
	tags: string[];
	lists: Record<string, Array<ListItem>>;
}

function readListItem(line: string): ListItem {
	const item: ListItem = {
		description: "",
	};

	const matches = line.match(
		/\- (\[(?<task>.)\] )?(?<date>\d{4}\-\d{2}\-\d{2})?[^a-zA-Z0-9]*(?<description>.*)/i,
	);
	if (matches) {
		item.task = matches.groups?.task as TASK_STATUS_ENUM | undefined;
		item.date =
			typeof matches.groups?.date === "string"
				? new Date(matches.groups.date)
				: undefined;
		item.description = matches.groups?.description ?? "";
	}

	return item;
}
function writeListItem(item: ListItem): string {
	const task = item.task !== undefined ? `[${item.task}] ` : "";
	const date =
		item.date !== undefined
			? `${item.date.toISOString().slice(0, 10)}: `
			: "";
	return `- ${task}${date}${item.description}`;
}

export async function readContact(
	app: App,
	path: string,
): Promise<Contact | null> {
	const cache = app.metadataCache.getCache(path);
	const file = app.vault.getFileByPath(path);
	if (!file || !cache) return null;
	const data = await app.vault.cachedRead(file);

	const contact: Contact = {
		name: cache.frontmatter?.name ?? "",
		email: cache.frontmatter?.email ?? "",
		phone: cache.frontmatter?.phone ?? "",
		image: cache.frontmatter?.image ?? "",
		events: cache.frontmatter?.events ?? [],
		tags: cache.frontmatter?.tags ?? [],
		lists: {},
	};

	let currentHeader = "Notes";
	for (const section of cache.sections ?? []) {
		if (section.type === "heading") {
			currentHeader = extractPos(data, section.position).replace(
				/^#+ /,
				"",
			);
		}
		if (section.type === "list") {
			contact.lists[currentHeader] ??= [];
			contact.lists[currentHeader].push(
				...extractPos(data, section.position)
					.split("\n")
					.map(readListItem),
			);
		}
	}

	return contact;
}

export async function writeContact(app: App, path: string, contact: Contact) {
	const { lists, ...frontmatter } = contact;
	let data = `---
${stringifyYaml(frontmatter)}
---

# ${frontmatter.name}

`;
	for (const heading in lists) {
		data += `## ${heading}\n\n${lists[heading].map(writeListItem).join("\n")}\n\n`;
	}

	const file = app.vault.getFileByPath(path);
	if (file) {
		app.vault.modify(file, data);
	} else {
		app.vault.create(path, data);
	}
}
