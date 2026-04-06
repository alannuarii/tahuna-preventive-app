import { createSignal, createEffect, For, JSX } from "solid-js";
import "./SegmentedControl.css";

export interface SegmentOption {
  value: string;
  label: string;
  icon: JSX.Element;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl(props: SegmentedControlProps) {
  let containerRef: HTMLDivElement | undefined;
  const [indicatorStyle, setIndicatorStyle] = createSignal({
    left: "0px",
    width: "0px",
  });

  const updateIndicator = () => {
    if (!containerRef) return;
    const activeIndex = props.options.findIndex(o => o.value === props.value);
    if (activeIndex === -1) return;
    const buttons = containerRef.querySelectorAll<HTMLButtonElement>(".seg-btn");
    const btn = buttons[activeIndex];
    if (btn) {
      setIndicatorStyle({
        left: `${btn.offsetLeft}px`,
        width: `${btn.offsetWidth}px`,
      });
    }
  };

  createEffect(() => {
    // React to value changes
    const _ = props.value;
    // Small delay to wait for DOM layout
    requestAnimationFrame(updateIndicator);
  });

  return (
    <div class="segmented-control" ref={containerRef}>
      <div
        class="seg-indicator"
        style={{
          left: indicatorStyle().left,
          width: indicatorStyle().width,
        }}
      />
      <For each={props.options}>
        {(option) => (
          <button
            class="seg-btn"
            classList={{ active: props.value === option.value }}
            onClick={() => props.onChange(option.value)}
          >
            <span class="seg-icon">{option.icon}</span>
            <span class="seg-label">{option.label}</span>
          </button>
        )}
      </For>
    </div>
  );
}
