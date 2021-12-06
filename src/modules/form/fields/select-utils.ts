export interface IOption {
	value: unknown;
	label: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object';
}

type InputOption = string | number | boolean | Record<string, unknown>;
export type OptionsProp = InputOption[] | Record<string, InputOption>;

export function normalizeOptions(props: { options: OptionsProp; valueKey: string; labelKey: string }): IOption[] {
	if (Array.isArray(props.options)) {
		return props.options
			.map<IOption | null>((item) => {
				if (['string', 'boolean', 'number'].includes(typeof item)) {
					return {
						value: item,
						label: `${item}`,
					};
				}
				if (isObject(item) && item[props.valueKey] !== undefined) {
					return {
						value: item[props.valueKey],
						label: `${item[props.labelKey]}`,
					};
				}
				return null;
			})
			.filter<IOption>((item): item is IOption => item !== null);
	}
	if (isObject(props.options)) {
		return Object.entries(props.options).map(([value, label]) => ({
			value,
			label: `${isObject(label) ? label[props.labelKey] : label}`,
		}));
	}
	return [];
}
