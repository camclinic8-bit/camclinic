'use client';

import Link from 'next/link';
import { User, UserPlus, Phone, Settings } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTechnicians } from '@/hooks/useTechnicians';
import { USER_ROLE_LABELS } from '@/types/enums';
import { useAuth } from '@/hooks/useAuth';

export default function TechniciansPage() {
  const { data: technicians, isLoading } = useTechnicians();
  const { isSuperAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Technicians & Staff" />
      
      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {isSuperAdmin && (
          <div className="flex justify-end">
            <Link href="/settings">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-24 bg-gray-100 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : technicians && technicians.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {technicians.map((tech) => (
              <Card key={tech.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{tech.full_name}</h3>
                        <Badge variant={tech.is_active ? 'success' : 'gray'}>
                          {tech.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {USER_ROLE_LABELS[tech.role]}
                      </p>
                      {tech.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{tech.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No technicians found</p>
              {isSuperAdmin && (
                <Link href="/settings">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Staff Member
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-700">
                    To add new technicians, service managers, or admins, go to{' '}
                    <Link href="/settings" className="text-blue-600 hover:underline font-medium">
                      Settings → User Management
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
