import DraggableGroup from 'vuedraggable';

export interface IChangeEvent {
	moved: {
		oldIndex: number;
		newIndex: number;
	};
}

export function isChangeEvent(event: unknown): event is IChangeEvent {
	return Object.prototype.hasOwnProperty.call(event, 'moved');
}

export function useDragAndDrop(onChange: (oldIndex: number, newIndex: number) => void) {
	return {
		onDragAndDrop(event: unknown) {
			if (!isChangeEvent(event) || event.moved.oldIndex === event.moved.newIndex) {
				return;
			}
			onChange(event.moved.oldIndex, event.moved.newIndex);
		},
	};
}

export default DraggableGroup;
