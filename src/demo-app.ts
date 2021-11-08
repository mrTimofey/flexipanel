import App from './main';
import bootstrap from './app';

const app = new App();
bootstrap(app.getIocContainer());
app.mount('#app');
