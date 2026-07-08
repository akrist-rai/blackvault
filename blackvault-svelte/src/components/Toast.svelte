<script>
  import { toastMsg } from '../stores/progress.js';
</script>

{#if $toastMsg}
  <div class="toast show">{$toastMsg}</div>
{/if}
