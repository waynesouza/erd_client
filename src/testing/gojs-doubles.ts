import * as go from 'gojs';
import { DiagramRendererService } from '../app/diagram/diagram-renderer.service';

/**
 * Stand-in for go.Diagram. The component only ever assigns `model`, `div` and
 * `isModified` on it - every genuine GoJS interaction lives behind
 * DiagramRendererService, which is stubbed alongside this.
 */
export class FakeDiagram {
  model: unknown = null;
  div: HTMLDivElement | null = null;
  isModified = false;
}

export const asDiagram = (fake: FakeDiagram): go.Diagram => fake as unknown as go.Diagram;

/** A diagram whose `model` setter throws - covers remakeDiagram's catch arm. */
export function createThrowingDiagram(): go.Diagram {
  const diagram = {};
  Object.defineProperty(diagram, 'model', {
    get: () => null,
    set: () => { throw new Error('model assignment failed'); }
  });
  Object.defineProperty(diagram, 'div', { value: null, writable: true });
  return diagram as go.Diagram;
}

export function createRendererSpy(
  diagram: go.Diagram = asDiagram(new FakeDiagram())
): jasmine.SpyObj<DiagramRendererService> {
  const spy = jasmine.createSpyObj<DiagramRendererService>('DiagramRendererService', [
    'create', 'applyLockStyling', 'refreshBindings'
  ]);
  spy.create.and.returnValue(diagram);
  return spy;
}
