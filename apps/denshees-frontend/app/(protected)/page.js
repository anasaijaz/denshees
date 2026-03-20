"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function ProtectedIndex() {
  return redirect("/dashboard");
}
