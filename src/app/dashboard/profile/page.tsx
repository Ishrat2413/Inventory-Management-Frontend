"use client";

import * as React from "react";
import { toast } from "sonner";
import { Camera, LogIn, LogOut, Loader2 } from "lucide-react";

import { SectionHeader } from "@/components/shared/chart-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useUpdateMe, useTodayStatus, useCheckIn, useCheckOut, useMyEarnings } from "@/hooks/queries/use-users";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateMe = useUpdateMe();
  const { data: today, isLoading: todayLoading } = useTodayStatus();
  const { data: earnings, isLoading: earningsLoading } = useMyEarnings();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [form, setForm] = React.useState({ name: user?.name ?? "", phone: user?.phone ?? "" });

  if (!user) return null;
  const displayName = user.name ?? user.email;

  const handleSave = () => {
    updateMe.mutate(
      { name: form.name, phone: form.phone },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (error) => toast.error("Couldn't update profile", { description: getApiErrorMessage(error) }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Profile" description="Manage your personal account details." />

      {user.role === "EMPLOYEE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s attendance</CardTitle>
            <CardDescription>Clock in and out — your earnings update in real time.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            {todayLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <>
                <Badge variant={today?.checkedIn ? (today?.checkedOut ? "muted" : "success") : "warning"}>
                  {today?.checkedOut ? "Checked out" : today?.checkedIn ? "Checked in" : "Not checked in"}
                </Badge>
                <div className="text-sm">
                  <span className="text-muted-foreground">Hours so far: </span>
                  <span className="tabular font-medium">{today?.hoursSoFar ?? 0}h</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Estimated pay: </span>
                  <span className="tabular font-medium">{formatCurrency(today?.estimatedPaySoFar ?? 0)}</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!!today?.checkedIn || checkIn.isPending}
                    onClick={() =>
                      checkIn.mutate(undefined, {
                        onSuccess: () => toast.success("Checked in"),
                        onError: (error) => toast.error("Check-in failed", { description: getApiErrorMessage(error) }),
                      })
                    }
                  >
                    {checkIn.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                    Check in
                  </Button>
                  <Button
                    disabled={!today?.checkedIn || !!today?.checkedOut || checkOut.isPending}
                    onClick={() =>
                      checkOut.mutate(undefined, {
                        onSuccess: () => toast.success("Checked out"),
                        onError: (error) => toast.error("Check-out failed", { description: getApiErrorMessage(error) }),
                      })
                    }
                  >
                    {checkOut.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                    Check out
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {user.role === "EMPLOYEE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings & Pay Summary</CardTitle>
            <CardDescription>
              Detailed breakdown of your accumulated wages for this month.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {earningsLoading ? (
              <p className="text-muted-foreground text-sm">Loading earnings…</p>
            ) : !earnings ? (
              <p className="text-muted-foreground text-sm">No earnings records found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Days Worked</p>
                  <p className="text-xl font-bold mt-1 tabular">{earnings.daysWorked}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Hours (Reg / OT)</p>
                  <p className="text-xl font-bold mt-1 tabular">
                    {earnings.regularHours}h / {earnings.overtimeHours}h
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Pay (Reg / OT)</p>
                  <p className="text-xl font-bold mt-1 tabular">
                    {formatCurrency(earnings.regularPay)} / {formatCurrency(earnings.overtimePay)}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-primary-soft text-primary">
                  <p className="text-xs font-semibold text-primary/85">Total Estimated Pay</p>
                  <p className="text-xl font-black mt-1 tabular">
                    {formatCurrency(earnings.totalEstimatedPay)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal information</CardTitle>
          <CardDescription>This information appears across the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <InitialsAvatar name={displayName} size="size-16" className="text-base" />
              <button className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full ring-2 ring-card cursor-pointer">
                <Camera className="size-3" />
              </button>
            </div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-muted-foreground text-sm">{user.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email address</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Input value={user.role} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone number</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div>
            <Button onClick={handleSave} disabled={updateMe.isPending}>
              {updateMe.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
