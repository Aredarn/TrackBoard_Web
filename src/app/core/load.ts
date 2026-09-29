import { ResourceStatus, Signal, computed } from '@angular/core';
import { RxResourceOptions, rxResource } from '@angular/core/rxjs-interop';

/** A resource whose value reads as undefined while loading or failed, instead of throwing. */
export interface Loaded<T> {
  readonly status: Signal<ResourceStatus>;
  readonly error: Signal<unknown>;
  readonly value: Signal<T | undefined>;
  reload(): void;
  set(value: T): void;
}

/**
 * `rxResource`, made safe to read from templates. A plain resource throws from `value()`
 * once its request has failed, which would take the whole view down with it; every page
 * here shows the failure through `tb-gate` instead, so a failed load must read as "no value".
 */
export function load<T, R>(options: RxResourceOptions<T, R>): Loaded<T> {
  const ref = rxResource(options);
  return {
    status: ref.status,
    error: ref.error,
    value: computed(() => (ref.hasValue() ? ref.value() : undefined)),
    reload: () => void ref.reload(),
    set: (v: T) => ref.set(v),
  };
}
