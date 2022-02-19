import type { Ref } from 'vue';
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

interface IUseFunctionReturnValue {
	onDragAndDrop(event: unknown): void;
}

type OnChangeWithIndices = (oldIndex: number, newIndex: number) => void;
type OnChangeWithItems<T> = (items: T[]) => void;

/**
 * Use this with DraggableGroup to implement order change logic.
 * @param onChange called when user drops an item to a new place, receives old index and new index
 */
export function useDragAndDrop(onChange: OnChangeWithIndices): IUseFunctionReturnValue;
/**
 * Use this with DraggableGroup to implement order change logic.
 * @param onChange called when user drops an item to a new place, receives new items array with swapped items
 * @param items any Ref`ish thing you want to be sortable
 */
export function useDragAndDrop<T>(onChange: OnChangeWithItems<T>, items?: Ref<T[]>): IUseFunctionReturnValue;
export function useDragAndDrop(onChange: OnChangeWithIndices | OnChangeWithItems<unknown>, items?: Ref<unknown[]>): IUseFunctionReturnValue {
	return {
		onDragAndDrop(event: unknown) {
			if (!isChangeEvent(event) || event.moved.oldIndex === event.moved.newIndex) {
				return;
			}
			if (items) {
				const item = items.value[event.moved.oldIndex];
				const newValue = items.value.slice();
				newValue.splice(event.moved.oldIndex, 1);
				newValue.splice(event.moved.newIndex, 0, item);
				(onChange as OnChangeWithItems<unknown>)(newValue);
			} else {
				(onChange as OnChangeWithIndices)(event.moved.oldIndex, event.moved.newIndex);
			}
		},
	};
}

export default DraggableGroup;
