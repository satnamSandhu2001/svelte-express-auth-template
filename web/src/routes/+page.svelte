<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user';
	import { Spinner } from 'flowbite-svelte';

	onMount(() => {
		const unsubscribe = userStore.subscribe((state) => {
			if (!state.isLoading) {
				if (state.user) {
					goto('/dashboard');
				} else {
					goto('/login');
				}
			}
		});

		return unsubscribe;
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<div role="status">
			<div class="text-center">
				<Spinner />
				<span class="sr-only">Loading...</span>
			</div>
		</div>
		<p class="mt-2 text-gray-600">Redirecting...</p>
	</div>
</div>
