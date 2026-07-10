"use client";

import { useEffect, useLayoutEffect } from "react";

// Use useLayoutEffect on client, useEffect on server
// This prevents hydration mismatches from browser-only code
const useIsomorphicLayoutEffect = 
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
