import { cookies } from 'next/headers';
import HomeClient from './home-client';

export default async function Page() {
  // checking for cookie on server
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get('is_logged_in')?.value === 'true';

  // sending login status to client as a prop
  return <HomeClient isLoggedIn={isLoggedIn} />;
}