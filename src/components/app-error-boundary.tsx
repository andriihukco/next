import { Component, type ErrorInfo, type ReactNode } from "react";

type State = { failed: boolean };

/**
 * Last line of defence before launch: a render error shows a calm recovery
 * screen instead of a blank page. Styles live in index.css (.app-error).
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("The app crashed while rendering.", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-error" role="alert">
        <h1>Щось пішло не так</h1>
        <p>Сторінка не змогла відкритися. Оновіть її — ваші налаштування збережено.</p>
        <button type="button" className="app-error-action" onClick={() => window.location.reload()}>
          Оновити сторінку
        </button>
      </main>
    );
  }
}
