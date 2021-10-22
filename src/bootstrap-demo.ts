import type Container from 'mini-ioc';
import EntityManager from './modules/entity-manager';
import AppConfig from './modules/app-config';

export default function bootstrap(container: Container): void {
	container
		.get(EntityManager)
		.registerEntity('x', {
			idKey: 'id',
			title: 'Entity {{=it.apiEndpoint}}',
			apiEndpoint: 'https://reqres.in/api/users',
			views: {
				default: {
					type: 'table',
					props: {
						columns: [
							{
								title: 'ID',
								key: 'id',
							},
							{
								title: 'E-mail',
								key: 'email',
							},
							{
								title: 'Avatar',
								key: 'avatar',
							},
						],
					},
				},
				list: {
					type: 'list',
					props: {
						displayType: 'template',
						displayTemplate: '<b>#{{=it.id}}</b> {{=it.email}}',
					},
				},
				list2: {
					type: 'list',
					props: {
						displayType: 'template',
						displayTemplate: '<b>#{{=it.id}}</b> {{=it.email}}',
					},
					perPageOptions: [1, 2, 3],
					perPage: 2,
				},
			},
		})
		.registerEntity('y', {
			idKey: 'id',
			title: 'Entity Y',
			apiEndpoint: 'https://reqres.in/api/posts',
			views: {
				default: {
					type: 'table',
					props: {
						columns: [
							{
								title: 'ID Y',
								key: 'id',
							},
							{
								title: 'Title Y',
								key: 'name',
							},
						],
					},
				},
			},
		});

	container.get(AppConfig).setConfig({
		mainNav: [
			{
				title: 'X table',
				to: { name: 'entityView', params: { entity: 'x' } },
			},
			{
				title: 'X list',
				to: { name: 'entityView', params: { entity: 'x', view: 'list' } },
			},
			{
				title: 'X list 2',
				to: { name: 'entityView', params: { entity: 'x', view: 'list2' } },
			},
			{
				title: 'Y',
				iconClass: 'fa-solid fa-user',
				to: { name: 'entityView', params: { entity: 'y' } },
			},
			{
				title: 'Пункт 4',
				children: [
					{
						title: 'Пункт 1',
					},
					{
						title: 'Пункт 2',
						iconClass: 'fa-solid fa-ambulance',
					},
					{
						title: 'Пункт 3',
						badges: [{ content: '100', tooltip: 'Количество новых элементов' }],
						children: [
							{
								title: 'Пункт 1',
							},
							{
								title: 'Пункт 2',
								iconClass: 'fa-solid fa-football',
							},
							{
								title: 'Пункт 3',
								badges: [{ content: '100', tooltip: 'Количество новых элементов' }],
							},
						],
					},
				],
			},
			{
				title: 'Пункт 3',
				badges: [{ content: '100' }],
				iconClass: 'fa-solid fa-ambulance',
			},
			{
				title: 'Пункт 4',
				children: [
					{
						title: 'Пункт 1',
					},
					{
						title: 'Пункт 2',
						iconClass: 'fa-solid fa-ambulance',
					},
					{
						title: 'Пункт 3',
						badges: [{ content: '100', tooltip: 'Количество новых элементов' }],
						children: [
							{
								title: 'Пункт 1',
							},
							{
								title: 'Пункт 2',
								iconClass: 'fa-solid fa-football',
							},
							{
								title: 'Пункт 3',
								badges: [{ content: '100', tooltip: 'Количество новых элементов' }],
							},
						],
					},
				],
			},
		],
	});
}
