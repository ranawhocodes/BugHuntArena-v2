import { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { PixelIcon } from './PixelIcon';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bha-error-boundary" role="alert">
          <div className="bha-error-boundary__icon" aria-hidden="true">
            <PixelIcon name="alert" size={42} />
          </div>
          <h2 className="bha-error-boundary__title">An unexpected glitch occurred</h2>
          <p className="bha-error-boundary__desc">
            Even bug hunting arenas sometimes encounter wild bugs!
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.reload()}
          >
            Reload Arena
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
