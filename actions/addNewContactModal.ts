import MyPlugin from "main";
import { Contact, addContact } from "models/Contact";
import { Modal, App, Setting } from "obsidian";

export class AddNewContactModal extends Modal {
	contact: Contact = {
		name: "",
		email: "",
		phone: "",
		image: "",
		tags: [],
		events: [],
		lists: {
			Notes: [],
			"Contact Log": [],
		},
	};
	constructor(
		app: App,
		public contactsDirectory: string,
	) {
		super(app);
	}

	onSubmit() {
		addContact(
			this.app,
			`${this.contactsDirectory}/${this.contact.name}.md`,
			this.contact,
		).then((file) => this.app.workspace.getLeaf(true).openFile(file));
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", { text: "Add Contact" });

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
		addText("Name", (value) => (this.contact.name = value));
		addText("Email", (value) => (this.contact.email = value));
		addText("Phone", (value) => (this.contact.phone = value));

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
