import { useLocation } from "@solidjs/router";
import { createMemo, JSX } from "solid-js";
import AppHeader from "./AppHeader";
import AppMenu from "./AppMenu";

export default function AppLayout(props: { children: JSX.Element }) {
  const location = useLocation();

  const isAuthPage = createMemo(() => {
    return location.pathname === "/login" || location.pathname.startsWith("/login/success");
  });

  return (
    <div class="app-wrapper">
      {isAuthPage() ? (
        <main>{props.children}</main>
      ) : (
        <>
          <AppHeader />
          <main class="app-content">
            <div class="container">
              {props.children}
            </div>
          </main>
          <AppMenu />
        </>
      )}
    </div>
  );
}
