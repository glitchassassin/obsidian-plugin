import { listContacts } from "models/Contact";
import { App, FuzzySuggestModal, TFile } from "obsidian";

export class SelectContactModal extends FuzzySuggestModal<TFile> {
	items: TFile[] = [];
	constructor(
		app: App,
		contactsDirectory: string,
		public onChooseItem: (
			item: TFile,
			evt: MouseEvent | KeyboardEvent,
		) => void,
	) {
		super(app);
		this.setPlaceholder("Select Contact");
		listContacts(this.app, contactsDirectory).then(
			(items) => (this.items = items),
		);
	}

	getItems(): TFile[] {
		return this.items;
	}

	getItemText(item: TFile): string {
		return item.basename;
	}
}
