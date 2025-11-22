/**
 * Displays Page
 * List and manage digital signage displays
 */

import { Monitor, Plus } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';

export default function DisplaysPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Displays</h2>
          <p className="text-muted-foreground">
            Manage your digital signage displays
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Display
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No displays configured yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Badge variant="default" className="h-2 w-2 rounded-full p-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Displays currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Displays offline or disconnected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>All Displays</CardTitle>
          <CardDescription>
            View and manage all your digital signage displays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Monitor className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No displays yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Get started by adding your first display
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Display
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
