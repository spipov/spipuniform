// Main App component

export class App {
  constructor() {
    this.name = 'Spipboiler';
  }

  render() {
    return `
      <div class="app">
        <h1>Welcome to ${this.name}</h1>
        <p>Your modern web application boilerplate is ready!</p>
      </div>
    `;
  }
}

export default App;