<template lang="pug">
form(@submit.prevent="onSubmit()" :class="{ loading: auth.isAuthenticating }")
	.mb-3
		.text-danger.text-center(v-if="auth.error") {{ auth.error }}
		.text-muted.text-center(v-else) {{ trans('loginToProceed') }}
	.form-floating
		input#auth-form-login-input.form-control(
			:disabled="auth.isAuthenticating"
			v-model="login"
			ref="loginInput"
		)
		label(for="auth-form-login-input") {{ trans('login') }}
	.form-floating
		input#auth-form-password-input.form-control(
			type="password"
			:disabled="auth.isAuthenticating"
			v-model="pswd"
		)
		label(for="auth-form-password-input") {{ trans('password') }}
	.text-center.mt-3
		button.btn-submit.btn.btn-primary.btn-lg.w-100(style="min-width:120px" :class="{ loading: auth.isAuthenticating }")
			.spinner-border.spinner-border-sm
			span.btn-submit-text {{ trans('loginAction') }}
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { get, useTranslator } from '../modules/vue-composition-utils';
import AuthStore from '../modules/auth/store';

export default defineComponent({
	setup() {
		const auth = get(AuthStore);
		const login = ref('');
		const pswd = ref('');
		const loginInput = ref<HTMLInputElement | null>(null);

		onMounted(() => {
			loginInput.value?.focus();
		});

		return {
			loginInput,
			auth,
			login,
			pswd,
			...useTranslator(),
			onSubmit() {
				if (!login.value || !pswd.value || auth.isAuthenticating) {
					return;
				}
				auth.authenticate({
					login: login.value,
					password: pswd.value,
				});
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
#auth-form-login-input
	border-bottom-left-radius 0
	border-bottom-right-radius 0
	margin-bottom -1px
#auth-form-password-input
	border-top-left-radius 0
	border-top-right-radius 0
.btn-submit
	position relative
	.spinner-border
		position absolute
		top 0
		right 0
		bottom 0
		left 0
		margin auto
		opacity 0
	&.loading
		.btn-submit-text
			color rgba(0, 0, 0, 0)
		.spinner-border
			opacity 1
</style>
