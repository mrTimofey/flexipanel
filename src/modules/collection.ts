export default function collection<T>() {
	const items = [] as T[];
	return {
		items,
		add(item: T) {
			items.push(item);
		},
		remove(item: T) {
			const index = items.indexOf(item);
			if (index === -1) {
				return;
			}
			items.splice(index, 1);
		},
	};
}
