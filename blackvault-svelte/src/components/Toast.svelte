<script>
  import { toastMsg } from '../stores/progress.js';
</script>

{#if $toastMsg}
  <div class="toast" data-show="1">{$toastMsg}</div>
{/if}
