import React from 'react';

interface ProductPlaceholderProps {
  productName: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ProductPlaceholder({ 
  productName, 
  width = 600, 
  height = 600,
  className = '',
  style = {}
}: ProductPlaceholderProps) {
  const displayName = productName.substring(0, 20) || 'Product';
  
  // XML escape function to handle special characters
  const xmlEscape = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const escapedDisplayName = xmlEscape(displayName);
  
  // Generate SVG data URI (client-side compatible)
  const svgContent = encodeURIComponent(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">
        ${escapedDisplayName}
      </text>
    </svg>
  `);
  
  const dataUri = `data:image/svg+xml,${svgContent}`;
  
  return (
    <img
      src={dataUri}
      alt={productName}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );
}
