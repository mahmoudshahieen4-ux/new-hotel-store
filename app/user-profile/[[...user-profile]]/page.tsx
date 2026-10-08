import Link from 'next/link';
import Image from 'next/image';
import { LuArrowLeft } from 'react-icons/lu';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UserProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back to store
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="text-lg">{session.user.name || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-lg">{session.user.email}</p>
            </div>

            {session.user.image && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Avatar</h3>
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Avatar'}
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                User ID: <code className="bg-muted px-2 py-1 rounded">{session.user.id}</code>
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-muted-foreground">
              <p className="font-medium mb-1">Note:</p>
              <p>
                Full profile editing capabilities coming soon. You can update your profile through your OAuth provider.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}