import {
	App,
	CachedMetadata,
	TFile,
	getFrontMatterInfo,
	parseYaml,
	stringifyYaml,
} from "obsidian";
import { extractPos } from "utils/extractPos";

export const TASK_STATUS = {
	Open: " ",
	Done: "x",
} as const;
export type TASK_STATUS_ENUM = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export interface ListItem {
	date?: Date;
	task?: TASK_STATUS_ENUM;
	description: string;
}

export interface Contact {
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
	return parseContact(data, cache);
}

export function parseContact(data: string, cache: CachedMetadata) {
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

export async function listContacts(app: App, path: string) {
	return (
		app.vault
			.getFolderByPath(path)
			?.children.filter((f): f is TFile => f instanceof TFile) ?? []
	);
}

export function stringifyContact(contact: Contact) {
	const { lists, ...frontmatter } = contact;
	let data = `---
${stringifyYaml(frontmatter)}
---

# ${frontmatter.name}

`;
	if (frontmatter.image) {
		data += `![[${frontmatter.image}]]\n\n`;
	}
	for (const heading in lists) {
		data += `## ${heading}\n\n${lists[heading].map(writeListItem).join("\n")}\n\n`;
	}
	return data;
}

export async function addContact(app: App, path: string, contact: Contact) {
	const data = stringifyContact(contact);
	return await app.vault.create(path, data);
}

export async function addContactListItem(
	app: App,
	path: string,
	list: string,
	item: ListItem,
) {
	const cache = app.metadataCache.getCache(path);
	const file = app.vault.getFileByPath(path);
	if (!file || !cache) return;
	app.vault.process(file, (data) => {
		const contact = parseContact(data, cache);
		if (!contact) return data;

		contact.lists[list] ??= [];
		contact.lists[list].push(item);

		return stringifyContact(contact);
	});
	return file;
}
