import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function Popover({ children, className = '' }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={popoverRef} className={`relative inline-block ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen,
            onClick: () => {
              setIsOpen(!isOpen);
              // Handle child onClick if it exists
            }
          } as any);
        }
        return child;
      })}
    </div>
  );
}

export function PopoverTrigger({
  children,
  asChild = false,
  onClick,
  isOpen,
  setIsOpen
}: PopoverTriggerProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
  const handleClick = () => {
    setIsOpen?.(!isOpen);
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

export function PopoverContent({
  children,
  className = '',
  align = 'center'
}: PopoverContentProps & { isOpen?: boolean }) {
  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  };

  return (
    <div
      className={`
        absolute top-full mt-1 z-50 bg-popover border rounded-md shadow-md
        ${alignClasses[align]} ${className}
      `}
    >
      {children}
    </div>
  );
}