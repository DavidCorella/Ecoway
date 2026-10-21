"use client";

import { PermissionProvider } from "../Context/PermissionContext";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  );
}