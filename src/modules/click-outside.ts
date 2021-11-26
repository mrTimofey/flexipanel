import type { ObjectDirective } from 'vue';

const pointerPressStartEvent = document.ontouchstart == null ? 'mousedown' : 'touchstart';
const pointerPressEndEvent = document.ontouchstart == null ? 'mouseup' : 'touchend';
const listenerKey = Symbol('ClickOutside');

function getPositionFromEvent(event: MouseEvent | TouchEvent) {
	return {
		x: (event as MouseEvent).clientX || (event as TouchEvent).touches[0]?.clientX || (event as TouchEvent).changedTouches[0]?.clientX || -1,
		y: (event as MouseEvent).clientY || (event as TouchEvent).touches[0]?.clientY || (event as TouchEvent).changedTouches[0]?.clientY || -1,
	};
}

interface IMarkedElement extends Node {
	[listenerKey]?: {
		pressStartListener: (e: MouseEvent | TouchEvent) => void;
		pressEndListener: (e: MouseEvent | TouchEvent) => void;
	};
}

function clearEvents(el: IMarkedElement) {
	const l = el[listenerKey];
	if (l) {
		document.removeEventListener(pointerPressStartEvent, l.pressStartListener);
		document.removeEventListener(pointerPressStartEvent, l.pressEndListener);
		delete el[listenerKey];
	}
}

function rebindEvents(el: IMarkedElement, callback: unknown) {
	clearEvents(el);

	let nextTick = false;
	setTimeout(() => {
		nextTick = true;
	}, 0);

	const pointerPosition = { x: -1, y: -1 };

	const pressStartListener = (event: MouseEvent | TouchEvent) => {
		if ((!el || !el.contains(event.target as Node)) && callback && nextTick && typeof callback === 'function') {
			Object.assign(pointerPosition, getPositionFromEvent(event));
		}
	};

	const pressEndListener = (event: MouseEvent | TouchEvent) => {
		if (pointerPosition.x > 0 && typeof callback === 'function') {
			const pos = getPositionFromEvent(event);
			if (Math.abs(pointerPosition.x - pos.x) < 4 && Math.abs(pointerPosition.y - pos.y) < 4) {
				callback.call(null, event);
			}
		}
		pointerPosition.x = -1;
		pointerPosition.y = -1;
	};

	document.addEventListener(pointerPressStartEvent, pressStartListener);
	document.addEventListener(pointerPressEndEvent, pressEndListener);
	el[listenerKey] = { pressStartListener, pressEndListener };
}

export default {
	mounted(el, binding) {
		rebindEvents(el, binding.value);
	},
	updated(el, binding) {
		if (binding.value === binding.oldValue) {
			return;
		}
		rebindEvents(el, binding.value);
	},
	beforeUnmount(el) {
		clearEvents(el);
	},
} as ObjectDirective;
