<script>
  import { toast } from '$lib/stores';
</script>

{#if $toast}
  <div class="toast toast-{$toast.kind}" role="status">
    {$toast.msg}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--panel3);
    border: 1px solid var(--line2);
    color: var(--bone);
    font-size: 13px;
    font-weight: 500;
    padding: 10px 20px;
    border-radius: var(--rad);
    z-index: 9999;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 24px rgba(0,0,0,.5);
    animation: slideup .2s ease;
  }
  .toast-success { border-color: var(--volt);  color: var(--volt); }
  .toast-error   { border-color: var(--blood); color: var(--blood); }
  .toast-badge   { border-color: var(--amber); color: var(--amber); }
  @keyframes slideup {
    from { opacity:0; transform:translateX(-50%) translateY(8px); }
    to   { opacity:1; transform:translateX(-50%) translateY(0); }
  }
</style>
