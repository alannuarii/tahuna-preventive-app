import { JSX, Show } from "solid-js";

interface DataCardProps {
  header?: JSX.Element;
  children: JSX.Element;
  footer?: JSX.Element;
}

export default function DataCard(props: DataCardProps) {
  return (
    <div class="card">
      <Show when={props.header}>
        <div class="card-header">
          {props.header}
        </div>
      </Show>
      <div class="card-body">
        {props.children}
      </div>
      <Show when={props.footer}>
        <div class="card-footer">
          {props.footer}
        </div>
      </Show>
    </div>
  );
}
