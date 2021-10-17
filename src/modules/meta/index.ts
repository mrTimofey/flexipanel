export default class Meta {
	get pageTitle(): string {
		return window.document.title;
	}

	set pageTitle(newTitle: string) {
		window.document.title = newTitle;
	}
}
