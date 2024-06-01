import { addContactListItem } from "models/Contact";
import { Modal, App, Setting } from "obsidian";

export class AddInteractionModal extends Modal {
	notes = "";
	constructor(
		app: App,
		public settings: {
			contactsDirectory: string;
			interactionLogList: string;
		},
		public contact: string,
	) {
		super(app);
	}

	onSubmit() {
		addContactListItem(
			this.app,
			`${this.settings.contactsDirectory}/${this.contact}.md`,
			this.settings.interactionLogList,
			{ date: new Date(), description: this.notes },
		).then(
			(file) => file && this.app.workspace.getLeaf(true).openFile(file),
		);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", {
			text: "Add Interaction with " + this.contact,
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
		addText("Notes", (value) => (this.notes = value));

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
