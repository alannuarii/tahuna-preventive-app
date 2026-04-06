import { createMemo, For, Show } from "solid-js";
import "./CommonPagination.css";

interface CommonPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export default function CommonPagination(props: CommonPaginationProps) {
  const visiblePages = createMemo(() => {
    const total = props.totalPages;
    const current = props.currentPage;
    const delta = 1;

    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | string)[] = [];
    pages.push(1);

    let left = Math.max(2, current - delta);
    let right = Math.min(total - 1, current + delta);

    if (current <= 3) right = 4;
    if (current >= total - 2) left = total - 3;

    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('...');
    pages.push(total);

    return pages;
  });

  return (
    <div class="pagination-container">
      <div class="pagination-mobile">
        <button 
          onClick={() => props.onChange(props.currentPage - 1)} 
          disabled={props.currentPage === 1}
          class="btn-pagination"
        >
          Previous
        </button>
        
        <span class="pagination-text">
          Page {props.currentPage}
        </span>

        <button 
          onClick={() => props.onChange(props.currentPage + 1)} 
          disabled={props.currentPage === props.totalPages}
          class="btn-pagination"
        >
          Next
        </button>
      </div>

      <div class="pagination-desktop">
        <div class="pagination-info">
          Showing <strong>{(props.currentPage - 1) * 10 + 1}</strong> to <strong>{Math.min(props.currentPage * 10, props.total)}</strong> of <strong>{props.total}</strong> results
        </div>
        
        <div class="pagination-controls">
          <button 
            onClick={() => props.onChange(props.currentPage - 1)} 
            disabled={props.currentPage === 1}
            class="btn-icon"
            title="Previous"
          >
            &lt;
          </button>
          
          <For each={visiblePages()}>{(page) => (
            <Show 
              when={page !== '...'} 
              fallback={<span class="pagination-dots">...</span>}
            >
              <button 
                onClick={() => props.onChange(page as number)}
                class="btn-page"
                classList={{ active: page === props.currentPage }}
              >
                {page}
              </button>
            </Show>
          )}</For>
          
          <button 
            onClick={() => props.onChange(props.currentPage + 1)} 
            disabled={props.currentPage === props.totalPages}
            class="btn-icon"
            title="Next"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
