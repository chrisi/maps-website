# Project Guidelines

## General
- Use TypeScript for all new source files.
- Prefer Vue 3 Composition API for Vue components.
- Keep changes minimal and focused on the requested task.
- Do not refactor unrelated code.
- Preserve existing behavior unless explicitly asked to change it.

## Vue
- Use `<script setup lang="ts">` for new Vue components.
- Use Pinia for shared application state.
- Avoid Options API in new components unless the surrounding code already uses it.

## TypeScript
- Avoid `any` unless there is no practical alternative.
- Prefer explicit types for public APIs.
- Keep strict null handling.

## Testing
- Don't write any tests
