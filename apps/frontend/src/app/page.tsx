/**
 * Root Page
 * Redirects to /home (dashboard) for authenticated users
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to home dashboard
  // Auth check happens in dashboard layout
  redirect('/home');
}
