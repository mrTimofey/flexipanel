import type { ObjectDirective } from 'vue';

const clickEventType = document.ontouchstart !== null ? 'click' : 'touchstart';
const listenerKey = Symbol('ClickOutside');

interface IMarkedElement extends Node {
	[listenerKey]?: (e: MouseEvent | TouchEvent) => void;
}

function clearEvents(el: IMarkedElement) {
	const listener = el[listenerKey];
	if (listener) {
		document.removeEventListener(clickEventType, listener, false);
		delete el[listenerKey];
	}
}

function rebindEvents(el: IMarkedElement, callback: unknown) {
	clearEvents(el);

	let nextTick = false;
	setTimeout(() => {
		nextTick = true;
	}, 0);

	const listener = (event: MouseEvent | TouchEvent) => {
		if ((!el || !el.contains(event.target as Node)) && callback && nextTick && typeof callback === 'function') {
			callback.call(null, event);
		}
	};

	document.addEventListener(clickEventType, listener, false);
	el[listenerKey] = listener;
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
