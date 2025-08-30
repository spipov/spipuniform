// Main index page

import { App } from '../components/App.js';

export class IndexPage {
  constructor() {
    this.app = new App();
  }

  render() {
    return `
      <main class="page-container">
        ${this.app.render()}
        <section class="features">
          <h2>Features</h2>
          <ul>
            <li>Modern JavaScript (ES6+)</li>
            <li>Modular architecture</li>
            <li>Development ready</li>
            <li>Easy to extend</li>
          </ul>
        </section>
      </main>
    `;
  }
}

export default IndexPage;