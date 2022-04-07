export interface IModalAction {
	type: 'primary' | 'secondary' | 'info' | 'warning' | 'danger' | 'light' | 'dark' | 'success';
	title: string;
}

export type ModalSize = 'sm' | 'lg' | 'xl' | 'fullscreen' | '';
