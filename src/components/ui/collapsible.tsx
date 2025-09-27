import React, { useState } from 'react';

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({ open, onOpenChange, children }: CollapsibleProps) {
  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange } as any);
        }
        return child;
      })}
    </div>
  );
}

export function CollapsibleTrigger({
  children,
  asChild = false,
  onClick
}: CollapsibleTriggerProps & { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    onClick?.();
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      'aria-expanded': isOpen,
    } as any);
  }

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}

export function CollapsibleContent({
  children,
  className = ''
}: CollapsibleContentProps & { open?: boolean }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}