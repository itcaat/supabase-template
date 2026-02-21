import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase Auth uses the Navigator LockManager API which conflicts with
  // React Strict Mode's deliberate double-mount in development — the second
  // mount tries to acquire the same lock before the first has released it,
  // causing a NavigatorLockAcquireTimeoutError. Strict Mode is a no-op in
  // production builds, so disabling it here only affects local development.
  reactStrictMode: false,
};

export default nextConfig;
