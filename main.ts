import { SelectContactModal } from "actions/selectContactModal";
import { AddNewContactModal } from "actions/addNewContactModal";
import { App, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { AddInteractionModal } from "actions/addInteractionModal";
import { Contact, readContact } from "models/Contact";
import { AddGroupEmailInteractionModal } from "actions/addGroupEmailInteractionModal";

// Remember to rename these classes and interfaces!

interface ObsidianGlitchassassinSettings {
	contactsDirectory: string;
	interactionLogList: string;
}

const DEFAULT_SETTINGS: ObsidianGlitchassassinSettings = {
	contactsDirectory: "Contacts",
	interactionLogList: "Contact Log",
};

export default class ObsidianGlitchassassin extends Plugin {
	settings: ObsidianGlitchassassinSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"user-plus",
			"Add New Contact",
			(evt: MouseEvent) => {
				// Launch AddNewContact modal
				new AddNewContactModal(
					this.app,
					this.settings.contactsDirectory,
				).open();
			},
		);
		this.addRibbonIcon(
			"tablet-smartphone",
			"Record Contact Interaction",
			(evt: MouseEvent) => {
				new SelectContactModal(
					this.app,
					this.settings.contactsDirectory,
					(contact) =>
						new AddInteractionModal(
							this.app,
							this.settings,
							contact.basename,
						).open(),
				).open();
			},
		);
		this.addRibbonIcon(
			"mails",
			"Record Deacon Care Group Email",
			(evt: MouseEvent) => {
				new AddGroupEmailInteractionModal(
					this.app,
					this.settings,
				).open();
			},
		);

		this.addCommand({
			id: "glitchassassin-add-new-contact",
			name: "Add new contact",
			callback: () => {
				new AddNewContactModal(
					this.app,
					this.settings.contactsDirectory,
				).open();
			},
		});
		this.addCommand({
			id: "glitchassassin-add-new-contact",
			name: "Record contact interaction",
			callback: () => {
				new SelectContactModal(
					this.app,
					this.settings.contactsDirectory,
					(contact) =>
						new AddInteractionModal(
							this.app,
							this.settings,
							contact.basename,
						).open(),
				).open();
			},
		});
		this.addCommand({
			id: "glitchassassin-deacon-care-group-email",
			name: "Record Deacon Care Group Email",
			callback: () => {
				new AddGroupEmailInteractionModal(
					this.app,
					this.settings,
				).open();
			},
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ContactsSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getContacts(): Promise<Array<Contact>> {
		const contactFiles =
			this.app.vault
				.getFolderByPath(this.settings.contactsDirectory)
				?.children.filter(
					(fileOrFolder): fileOrFolder is TFile =>
						fileOrFolder instanceof TFile,
				) ?? [];
		const contacts = await Promise.all(
			contactFiles.map((file) => readContact(this.app, file.path)),
		);
		return contacts
			.filter((contact): contact is Contact => Boolean(contact))
			.sort((a, b) => {
				return (
					(a.lastContacted?.getTime() ?? 0) -
					(b.lastContacted?.getTime() ?? 0)
				);
			});
	}
}

class ContactsSettingTab extends PluginSettingTab {
	plugin: ObsidianGlitchassassin;

	constructor(app: App, plugin: ObsidianGlitchassassin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Contacts Directory").addText((text) =>
			text
				.setPlaceholder("Enter your secret")
				.setValue(this.plugin.settings.contactsDirectory)
				.onChange(async (value) => {
					this.plugin.settings.contactsDirectory = value;
					await this.plugin.saveSettings();
				}),
		);
		new Setting(containerEl)
			.setName("Interactions list name")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.interactionLogList)
					.onChange(async (value) => {
						this.plugin.settings.interactionLogList = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
