/* eslint-disable @typescript-eslint/ban-ts-comment */
import App from './main';
// @ts-ignore
import bootstrap from './app';

const app = new App();
// @ts-ignore
bootstrap(app.getIocContainer());
app.mount('#app');
