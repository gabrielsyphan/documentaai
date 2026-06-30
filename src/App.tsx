import { useEffect } from "react";
import { usePagesStore } from "./store/pages.store";
import AppShell from "./components/layout/AppShell";

export default function App() {
  const { load } = usePagesStore();

  useEffect(() => {
    load();
  }, []);

  return <AppShell />;
}
