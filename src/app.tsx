import { MetaProvider, Title, Meta, Link } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import AppLayout from "~/components/AppLayout";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>PLTD Tahuna Maintenance App</Title>
          <Meta name="description" content="Preventive Maintenance System - PLTD Tahuna" />
          <Meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1" />
          <Meta name="theme-color" content="#0c0c14" />
          <Meta name="apple-mobile-web-app-capable" content="yes" />
          <Meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <Suspense>
             <AppLayout>{props.children}</AppLayout>
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
