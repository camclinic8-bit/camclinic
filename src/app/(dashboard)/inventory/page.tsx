'use client';

import Link from 'next/link';
import { Package, Box, Layers } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function InventoryPage() {
  const inventoryItems = [
    {
      title: 'Accessories',
      description: 'Manage camera accessories like batteries, chargers, lens caps, etc.',
      icon: Package,
      href: '/inventory/accessories',
      color: 'bg-blue-500',
    },
    {
      title: 'Brands',
      description: 'Manage camera brands like Canon, Nikon, Sony, etc.',
      icon: Box,
      href: '/inventory/brands',
      color: 'bg-purple-500',
    },
    {
      title: 'Models',
      description: 'Manage camera models under each brand.',
      icon: Layers,
      href: '/inventory/brands',
      color: 'bg-green-500',
      note: 'Navigate to Brands to manage models',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Inventory" />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="border-gray-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${item.color}`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  {item.note && (
                    <p className="text-xs text-gray-500 italic">{item.note}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
