import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/dashboard" as never)({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});