import { redirect } from 'next/navigation';

export default function LegacySprintRedirect() {
  redirect('/sprints');
}
