import { addContactListItem, listContacts, readContact } from "models/Contact";
import { Modal, App, Setting } from "obsidian";

export class AddGroupEmailInteractionModal extends Modal {
	emailDescription = "";
	constructor(
		app: App,
		public settings: {
			contactsDirectory: string;
			interactionLogList: string;
		},
	) {
		super(app);
	}

	onSubmit() {
		this.updateDeaconCareGroup(this.emailDescription);
	}

	async updateDeaconCareGroup(emailDescription: string) {
		const contacts = await listContacts(
			this.app,
			this.settings.contactsDirectory,
		);
		for (const contact of contacts) {
			const contactData = await readContact(this.app, contact.path);
			if (
				!contactData ||
				!contactData.tags.includes("deacon-care-group") ||
				!contactData.email
			)
				continue;
			// contact exists, is in the deacon care group, and has an email address
			await addContactListItem(
				this.app,
				contact.path,
				this.settings.interactionLogList,
				{ date: new Date(), description: "✉️" + emailDescription },
			);
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", {
			text: "Record Deacon Care Group Email",
		});

		const addText = (name: string, onChange: (value: string) => void) => {
			new Setting(contentEl).setName(name).addText((text) => {
				text.onChange(onChange);
				text.inputEl.addEventListener("keydown", (event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						this.close();
						this.onSubmit();
					}
				});
			});
		};
		addText("Email Summary", (value) => (this.emailDescription = value));

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit();
				}),
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
