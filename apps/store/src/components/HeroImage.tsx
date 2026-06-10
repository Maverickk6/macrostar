'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function HeroImage() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-background" />
    );
  }

  return (
    <Image
      src="https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=2071&auto=format&fit=crop"
      alt="Gaming PC with colorful components"
      fill
      className="object-cover"
      priority
      onError={() => setImageError(true)}
    />
  );
}
