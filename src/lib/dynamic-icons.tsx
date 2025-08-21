import { ComponentType } from 'react';
import { IconBaseProps } from 'react-icons';

// Cache for loaded icons
const iconCache = new Map<string, ComponentType<IconBaseProps>>();

/**
 * Dynamically load react-icons to reduce initial bundle size
 * Icons are loaded only when needed and cached for subsequent use
 */
export async function loadIcon(iconName: string, library: string = 'fa'): Promise<ComponentType<IconBaseProps> | null> {
  const cacheKey = `${library}:${iconName}`;
  
  // Return cached icon if available
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  try {
    let iconModule;
    
    switch (library) {
      case 'fa':
        iconModule = await import('react-icons/fa');
        break;
      case 'fi':
        iconModule = await import('react-icons/fi');
        break;
      case 'hi':
        iconModule = await import('react-icons/hi');
        break;
      case 'md':
        iconModule = await import('react-icons/md');
        break;
      case 'io':
        iconModule = await import('react-icons/io5');
        break;
      default:
        iconModule = await import('react-icons/fa');
    }

    const IconComponent = iconModule[iconName as keyof typeof iconModule] as ComponentType<IconBaseProps>;
    
    if (IconComponent) {
      iconCache.set(cacheKey, IconComponent);
      return IconComponent;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to load icon ${iconName} from ${library}:`, error);
    return null;
  }
}

/**
 * Dynamic Icon Component that loads icons on demand
 */
interface DynamicIconProps extends IconBaseProps {
  name: string;
  library?: string;
  fallback?: ComponentType<IconBaseProps>;
}

export function DynamicIcon({ name, library = 'fa', fallback, ...props }: DynamicIconProps) {
  const [IconComponent, setIconComponent] = React.useState<ComponentType<IconBaseProps> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadIcon(name, library).then((icon) => {
      setIconComponent(icon);
      setIsLoading(false);
    });
  }, [name, library]);

  if (isLoading) {
    return fallback ? React.createElement(fallback, props) : <span {...props}>⏳</span>;
  }

  if (!IconComponent) {
    return fallback ? React.createElement(fallback, props) : <span {...props}>❓</span>;
  }

  return React.createElement(IconComponent, props);
}

// Pre-load commonly used icons for better UX
export function preloadCommonIcons() {
  const commonIcons = [
    'FaShoppingCart', 'FaUser', 'FaSearch', 'FaHeart', 'FaBars',
    'FaTimes', 'FaCheck', 'FaArrowLeft', 'FaArrowRight', 'FaHome'
  ];

  commonIcons.forEach(iconName => {
    loadIcon(iconName, 'fa');
  });
}

// React import for the component
import React from 'react';