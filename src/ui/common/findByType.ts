import { Children, isValidElement, type ComponentType, type ReactElement, type ReactNode } from 'react';

export function findByType<P>(children: ReactNode, type: ComponentType<P>): ReactElement<P> | undefined {
    return Children.toArray(children).find((child): child is ReactElement<P> => isValidElement(child) && child.type === type);
}
