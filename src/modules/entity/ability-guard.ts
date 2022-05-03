import type { IRegisteredEntity } from '.';

export default class EntityAbilityGuard {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	can(action: string, entity: IRegisteredEntity, item?: Record<string, unknown>): boolean {
		return true;
	}
}
