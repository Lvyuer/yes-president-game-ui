<script setup lang="ts">
export interface ApiRow {
  name: string;
  desc: string;
  type: string;
  defaultValue?: string;
}

defineProps<{
  title?: string;
  rows: ApiRow[];
}>();
</script>

<template>
  <section class="docs-api">
    <h3 class="docs-api__title">{{ title ?? 'API' }}</h3>
    <div class="docs-api__table-wrap">
      <table class="docs-api__table">
        <thead>
          <tr>
            <th>属性</th>
            <th>说明</th>
            <th>类型</th>
            <th>默认值</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name">
            <td><code>{{ row.name }}</code></td>
            <td>{{ row.desc }}</td>
            <td><code>{{ row.type }}</code></td>
            <td><code>{{ row.defaultValue ?? '—' }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.docs-api {
  margin-top: 36px;
}

.docs-api__title {
  margin: 0 0 14px;
  font-family: var(--yp-font-serif);
  font-size: 1.2rem;
  color: var(--yp-color-text-main);
  letter-spacing: 0.05em;
}

.docs-api__table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(184, 149, 98, 0.28);
}

.docs-api__table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--yp-font-sans);
  font-size: 0.88rem;
}

.docs-api__table th,
.docs-api__table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(184, 149, 98, 0.16);
  vertical-align: top;
}

.docs-api__table th {
  background: rgba(28, 34, 40, 0.95);
  color: var(--yp-color-gold-bright);
  font-weight: 600;
  white-space: nowrap;
}

.docs-api__table td {
  color: var(--yp-color-text-muted);
  background: rgba(12, 14, 16, 0.65);
}

.docs-api__table code {
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.8rem;
  color: #f0e4c8;
}
</style>
