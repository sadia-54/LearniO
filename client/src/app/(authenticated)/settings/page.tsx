"use client";
import { signOut, useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

type Settings = {
  email_reminder: boolean;
  reminderFrequency: string;
  reminderTypes: string[];
  inAppNotifications: boolean;
  notificationSound: boolean;
  motivationalTips: boolean;
  tipFrequency: string;
  daily_study_hours: number;
  interface_theme: string;
  weekend_days: string[];
};

const REMINDER_TYPES = ["Pending Tasks", "Upcoming Deadlines", "Motivational Tips"];
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<{ settings: Settings}>({
    queryKey: ["settings", session?.user?.user_id],
  queryFn: async () => (await api.get(`/api/users/${session!.user.user_id}/settings`)).data,
    enabled: !!session?.user?.user_id,
  });

  const updateMutation = useMutation({
  mutationFn: async (updates: Partial<Settings>) => (await api.put(`/api/users/${session!.user.user_id}/settings`, updates)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", session?.user?.user_id] }),
  });

  const s = data?.settings;

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">User Settings</h1>

        {isLoading && <div className="rounded-lg border p-6 bg-white">Loading settings…</div>}
        {error && <div className="rounded-lg border p-6 bg-rose-50 text-rose-700">Failed to load settings.</div>}

        {s && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Notifications & Reminders */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Notifications & Reminders</h2>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Enable Email Reminders</div>
                  <div className="text-sm text-gray-500">Receive study reminders and updates via email.</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={s.email_reminder} onChange={(e)=>updateMutation.mutate({ email_reminder: e.target.checked })} />
              </div>
              <div className="mt-3">
                <label className="text-sm text-gray-600">Reminder Frequency</label>
                <select className="mt-1 w-full rounded-md border p-2" value={s.reminderFrequency} onChange={(e)=>updateMutation.mutate({ reminderFrequency: e.target.value })}>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Weekdays</option>
                </select>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600">Reminder Types</div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {REMINDER_TYPES.map((t) => {
                    const on = s.reminderTypes.includes(t);
                    return (
                      <button key={t} onClick={()=>{
                        const next = on ? s.reminderTypes.filter(x=>x!==t) : [...s.reminderTypes, t];
                        updateMutation.mutate({ reminderTypes: next });
                      }} className={`px-3 py-1 rounded-md border ${on ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium text-gray-900">In-App Notifications</div>
                    <div className="text-xs text-gray-500">Important updates and achievements.</div>
                  </div>
                  <input type="checkbox" className="h-5 w-5" checked={s.inAppNotifications} onChange={(e)=>updateMutation.mutate({ inAppNotifications: e.target.checked })} />
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium text-gray-900">Notification Sound</div>
                    <div className="text-xs text-gray-500">Play a tone for alerts.</div>
                  </div>
                  <input type="checkbox" className="h-5 w-5" checked={s.notificationSound} onChange={(e)=>updateMutation.mutate({ notificationSound: e.target.checked })} />
                </div>
              </div>
            </div>

            

            {/* Content Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Content Preferences</h2>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Show Motivational Tips</div>
                  <div className="text-sm text-gray-500">Encouraging messages during study sessions.</div>
                </div>
                <input type="checkbox" className="h-5 w-5" checked={s.motivationalTips} onChange={(e)=>updateMutation.mutate({ motivationalTips: e.target.checked })} />
              </div>
              <div className="mt-3">
                <label className="text-sm text-gray-600">Tips Frequency</label>
                <select className="mt-1 w-full rounded-md border p-2" value={s.tipFrequency} onChange={(e)=>updateMutation.mutate({ tipFrequency: e.target.value })}>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Occasionally</option>
                </select>
              </div>
            </div>

            {/* Study Schedule */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Study Schedule</h2>
              <div className="mt-3">
                <label className="text-sm text-gray-600">Daily Study Hours</label>
                <input type="number" min={1} max={10} className="mt-1 w-32 rounded-md border p-2" value={s.daily_study_hours}
                  onChange={(e)=>updateMutation.mutate({ daily_study_hours: Number(e.target.value) || 1 })} />
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-1">Weekend Days</div>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => {
                    const on = s.weekend_days.includes(d);
                    return (
                      <button key={d} onClick={()=>{
                        const next = on ? s.weekend_days.filter(x=>x!==d) : [...s.weekend_days, d];
                        updateMutation.mutate({ weekend_days: next });
                      }} className={`px-2 py-1 rounded-md border ${on ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{d}</button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3">
                <label className="text-sm text-gray-600">Theme</label>
                <select className="mt-1 w-full rounded-md border p-2" value={s.interface_theme} onChange={(e)=>updateMutation.mutate({ interface_theme: e.target.value })}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            {/* Account Actions (no password change) */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Data & Account</h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="rounded-md border border-teal-600 bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700">Export All Study Data</button>
                <button
                  onClick={async ()=>{
                    const confirm1 = window.confirm('This will permanently delete your account and all study data. This cannot be undone.\n\nType "DELETE" to confirm.');
                    if (!confirm1) return;
                    const input = window.prompt('Please type DELETE to confirm:');
                    if (input !== 'DELETE') return;
                    try {
                      await api.delete(`/api/users/${session!.user.user_id}`);
                      // Sign out after deletion
                      await signOut({ callbackUrl: '/' });
                    } catch { alert('Failed to delete account.'); }
                  }}
                  className="rounded-md border border-red-600 bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">Password change is not available because you sign in with Google.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
